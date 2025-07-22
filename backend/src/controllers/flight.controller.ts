import { strictDateExtraction } from "../utils/dateStrict";
import { Request, Response } from 'express';
import Flight, { IFlight } from '../models/Flight';
import { storageService } from '../services/storage.service';
import { parseBoardingPass } from '../utils/boardingPassParser';
import { parseBoardingPassV2, convertToLegacyFormat } from '../utils/boardingPassParserV2';
import { parseBoardingPassWithMathpix } from '../utils/boardingPassMathpix';
import { parseBoardingPassWithTesseract } from '../utils/boardingPassTesseract';
import { parseBoardingPassWithSimpletex } from '../utils/boardingPassSimpletex';
import { parseBoardingPassWithSimpletexV2 } from '../utils/boardingPassSimpletexV2';
import { parseBoardingPassWithSimpletexV3 } from '../utils/boardingPassSimpletexV3';
import { calculateFlightDistance } from '../utils/distanceCalculator';

export const uploadBoardingPass = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No boarding pass file provided' });
    }

    // Upload to storage with configurable folder
    const uploadFolder = process.env.BOARDING_PASS_UPLOAD_FOLDER || 'boarding-passes';
    const uploadResult = await storageService.upload({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size
    }, {
      folder: `${uploadFolder}/${userId}`
    });
    const boardingPassUrl = uploadResult.url;

    // Parse boarding pass data - Try SimpleTex first
    let parsedData = null;
    
    // Try SimpleTex OCR API V3 first (with strict handling)
    if (process.env.SIMPLETEX_API_KEY) {
      console.log('Trying SimpleTex OCR API V3 (strict mode)...');
      const v3Result = await parseBoardingPassWithSimpletexV3(file.buffer, file.mimetype);
      
      if (v3Result.success && v3Result.data) {
        console.log('SimpleTex OCR V3 succeeded with strict validation');
        parsedData = v3Result.data;
        
        // If manual entry required for some fields, include in response
        if (v3Result.requiresManualEntry) {
          parsedData.requiresManualEntry = v3Result.requiresManualEntry;
        }
      } else if (v3Result.errors) {
        // V3 failed with specific errors
        console.log('SimpleTex V3 validation failed:', v3Result.errors);
        
        // Return structured error response
        return res.status(422).json({
          message: 'Boarding pass parsing incomplete',
          errors: v3Result.errors,
          requiresManualEntry: v3Result.requiresManualEntry,
          partialData: v3Result.data
        });
      } else {
        // Fallback to V2
        console.log('Trying SimpleTex OCR API V2...');
        parsedData = await parseBoardingPassWithSimpletexV2(file.buffer, file.mimetype);
        if (parsedData) {
          console.log('SimpleTex OCR V2 succeeded');
        }
      }
    }
    
    // Try enhanced Tesseract OCR if SimpleTex fails
    if (!parsedData) {
      console.log('Trying enhanced Tesseract OCR...');
      const tesseractResult = await parseBoardingPassWithTesseract(file.buffer, file.mimetype);
      if (tesseractResult) {
        console.log('Tesseract OCR succeeded');
        parsedData = convertToLegacyFormat(tesseractResult);
      }
    }
    
    if (!parsedData && process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY) {
      console.log('Trying Mathpix OCR...');
      const mathpixResult = await parseBoardingPassWithMathpix(file.buffer, file.mimetype);
      if (mathpixResult) {
        console.log('Mathpix OCR succeeded');
        parsedData = convertToLegacyFormat(mathpixResult);
      }
    }
    
    if (!parsedData) {
      // Try V2 parser
      const v2Result = await parseBoardingPassV2(file.buffer, file.mimetype);
      if (v2Result) {
        console.log('V2 Parser succeeded - Gate found:', v2Result.boardingInfo.gate);
        parsedData = convertToLegacyFormat(v2Result);
      } else {
        // Fallback to old parser
        console.log('V2 Parser failed, trying legacy parser');
        parsedData = await parseBoardingPass(file.buffer, file.mimetype);
      }
    }

    if (!parsedData) {
      return res.status(400).json({ message: 'Could not parse boarding pass data' });
    }

    // Calculate distance between airports
    const distance = await calculateFlightDistance(parsedData.origin.airportCode, parsedData.destination.airportCode);

    // Create flight record
    const flight = new Flight({
      userId,
      ...parsedData,
      distance,
      boardingPassUrl
    });

    // Calculate points
    flight.points = flight.calculatePoints();
    
    // Check if the flight date has passed and mark as completed
    const now = new Date();
    if (flight.scheduledArrivalTime < now) {
      flight.status = 'completed';
    }

    await flight.save();

    res.status(201).json({
      message: 'Boarding pass uploaded successfully',
      flight
    });
  } catch (error) {
    console.error('Error uploading boarding pass:', error);
    res.status(500).json({ message: 'Failed to upload boarding pass' });
  }
};

export const manualFlightEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const flightData = req.body;

    // Validate required fields - only airports and date are required
    const requiredFields = ['origin', 'destination', 'scheduledDepartureTime'];
    for (const field of requiredFields) {
      if (!flightData[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    
    // Estimate arrival time if not provided using route-based calculation
    if (!flightData.scheduledArrivalTime && flightData.origin && flightData.destination) {
      const { estimateArrivalTime } = require('../services/timeHandling.service');
      const departureDate = new Date(flightData.scheduledDepartureTime);
      flightData.scheduledArrivalTime = estimateArrivalTime(
        departureDate,
        flightData.origin.airportCode,
        flightData.destination.airportCode
      );
      console.log(`Estimated arrival time for ${flightData.origin.airportCode}-${flightData.destination.airportCode}`);
    }

    // Calculate distance if not provided
    if (!flightData.distance) {
      flightData.distance = await calculateFlightDistance(flightData.origin.airportCode, flightData.destination.airportCode);
    }

    // Create flight record
    const flight = new Flight({
      userId,
      ...flightData
    });

    // Calculate points
    flight.points = flight.calculatePoints();
    
    // Check if the flight date has passed and mark as completed
    const now = new Date();
    if (flight.scheduledArrivalTime < now) {
      flight.status = 'completed';
    }

    await flight.save();

    res.status(201).json({
      message: 'Flight added successfully',
      flight
    });
  } catch (error) {
    console.error('Error adding flight:', error);
    res.status(500).json({ message: 'Failed to add flight' });
  }
};

export const getMyFlights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { status, airline, limit = 20, offset = 0 } = req.query;

    const query: any = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (airline) {
      query.airline = airline;
    }

    const flights = await Flight.find(query)
      .sort({ scheduledDepartureTime: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await Flight.countDocuments(query);

    res.json({
      flights,
      total,
      hasMore: Number(offset) + flights.length < total
    });
  } catch (error) {
    console.error('Error getting flights:', error);
    res.status(500).json({ message: 'Failed to get flights' });
  }
};

export const getFlightStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { year } = req.query;

    const matchQuery: any = { userId };
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      matchQuery.scheduledDepartureTime = { $gte: startDate, $lte: endDate };
    }

    const stats = await Flight.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalFlights: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalPoints: { $sum: '$points' },
          airlines: { $addToSet: '$airline' },
          destinations: { $addToSet: '$destination.city' }
        }
      },
      {
        $project: {
          _id: 0,
          totalFlights: 1,
          totalDistance: 1,
          totalPoints: 1,
          uniqueAirlines: { $size: '$airlines' },
          uniqueDestinations: { $size: '$destinations' },
          airlines: 1,
          destinations: 1
        }
      }
    ]);

    // Get flights by month
    const flightsByMonth = await Flight.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $month: '$scheduledDepartureTime' },
          count: { $sum: 1 },
          distance: { $sum: '$distance' },
          points: { $sum: '$points' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top routes
    const topRoutes = await Flight.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            origin: '$origin.city',
            destination: '$destination.city'
          },
          count: { $sum: 1 },
          totalDistance: { $sum: '$distance' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      summary: stats[0] || {
        totalFlights: 0,
        totalDistance: 0,
        totalPoints: 0,
        uniqueAirlines: 0,
        uniqueDestinations: 0
      },
      flightsByMonth,
      topRoutes
    });
  } catch (error) {
    console.error('Error getting flight stats:', error);
    res.status(500).json({ message: 'Failed to get flight statistics' });
  }
};

export const updateFlightStatus = async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const { status } = req.body;
    const userId = req.user?._id;

    const flight = await Flight.findOne({ _id: flightId, userId });
    
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    flight.status = status;
    await flight.save();

    res.json({
      message: 'Flight status updated',
      flight
    });
  } catch (error) {
    console.error('Error updating flight status:', error);
    res.status(500).json({ message: 'Failed to update flight status' });
  }
};

export const getFlightById = async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const userId = req.user?._id;

    const flight = await Flight.findOne({ _id: flightId, userId });
    
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({ flight });
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({ message: 'Failed to fetch flight' });
  }
};

export const updateFlight = async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const userId = req.user?._id;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates._id;
    delete updates.userId;
    delete updates.boardingPassUrl;

    const flight = await Flight.findOneAndUpdate(
      { _id: flightId, userId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    // Recalculate points if flight details changed
    if (updates.seatClass || updates.distance) {
      flight.points = flight.calculatePoints();
      await flight.save();
    }

    res.json({ 
      message: 'Flight updated successfully',
      flight 
    });
  } catch (error) {
    console.error('Error updating flight:', error);
    res.status(500).json({ message: 'Failed to update flight' });
  }
};

export const deleteFlight = async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const userId = req.user?._id;

    const flight = await Flight.findOneAndDelete({ _id: flightId, userId });
    
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({ message: 'Flight deleted successfully' });
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({ message: 'Failed to delete flight' });
  }
};