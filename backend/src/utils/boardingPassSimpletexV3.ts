import { safeStrictDateExtraction } from "./dateStrict";
import axios from 'axios';
import FormData from 'form-data';
import { validateBoardingPass } from './boardingPassValidator';
import { 
  strictDateExtraction,
  estimateArrivalTime,
  safeParseTime,
  getAirlineTimeOrder
} from './strictTimeHandling';
import { BoardingPassError } from '../errors/BoardingPassError';

// SimpleTex API configuration
const SIMPLETEX_API_URL = 'https://server.simpletex.net/api/latex_ocr';
const SIMPLETEX_API_KEY = process.env.SIMPLETEX_API_KEY || '';

interface SimpletexResponse {
  status: string;
  res: string;
  error?: string;
  confidence?: Array<{ word: string; confidence: number }>;
}

interface ParseResult {
  success: boolean;
  data?: any;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
    suggestion: string;
  }>;
  requiresManualEntry?: string[];
}

export async function parseBoardingPassWithSimpletexV3(
  buffer: Buffer, 
  mimeType: string
): Promise<ParseResult> {
  try {
    console.log('Using SimpleTex OCR API V3 with strict time handling...');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'boarding_pass.jpg',
      contentType: mimeType
    });

    // Make request to SimpleTex
    const response = await axios.post(SIMPLETEX_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'token': SIMPLETEX_API_KEY
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const data: SimpletexResponse = response.data;
    
    if (data.status === 'success' && data.res) {
      console.log('SimpleTex OCR Result:', data.res);
      
      // First use validation layer
      const validation = validateBoardingPass({
        text: data.res,
        confidence: data.confidence
      });
      
      // Parse with strict handling
      return parseWithStrictHandling(data.res, validation);
    } else {
      console.error('SimpleTex OCR failed:', data.error);
      return {
        success: false,
        errors: [{
          field: 'ocr',
          code: 'OCR_FAILED',
          message: 'OCR processing failed',
          suggestion: 'Please try again with better lighting or enter manually'
        }]
      };
    }
  } catch (error) {
    console.error('SimpleTex API Error:', error);
    return {
      success: false,
      errors: [{
        field: 'api',
        code: 'API_ERROR',
        message: 'Failed to connect to OCR service',
        suggestion: 'Please check your connection and try again'
      }]
    };
  }
}

function parseWithStrictHandling(text: string, validation: any): ParseResult {
  const normalizedText = text.toUpperCase().replace(/\s+/g, ' ').trim();
  const errors: any[] = [];
  const requiresManualEntry: string[] = [];
  
  const result: any = {
    status: 'upcoming',
    extractionMethod: 'simpletex_v3'
  };
  
  // Extract basic data from validation
  const { extractedData } = validation;
  
  // 1. AIRPORTS (Required)
  if (!extractedData.origin || !extractedData.destination) {
    errors.push({
      field: 'airports',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Could not extract origin and destination airports',
      suggestion: 'Please ensure both airports are visible in the image'
    });
    requiresManualEntry.push('origin', 'destination');
    return { success: false, errors, requiresManualEntry };
  }
  
  result.origin = {
    airportCode: extractedData.origin,
    city: extractedData.origin // Will be enriched later
  };
  
  result.destination = {
    airportCode: extractedData.destination,
    city: extractedData.destination // Will be enriched later
  };
  
  // 2. FLIGHT INFO
  if (extractedData.flightNumber) {
    result.flightNumber = extractedData.flightNumber;
    const airlineCode = extractedData.flightNumber.match(/^[A-Z]{2}/)?.[0];
    if (airlineCode) {
      result.airline = getAirlineName(airlineCode);
      result.airlineCode = airlineCode;
    }
  }
  
  // 3. DATE EXTRACTION (Strict - no fallbacks)
  let flightDate: Date | null = null;
  try {
    flightDate = strictDateExtraction(normalizedText);
    result.flightDate = flightDate.toISOString();
  } catch (error) {
    if (error instanceof BoardingPassError) {
      errors.push({
        field: 'date',
        code: error.code,
        message: error.message,
        suggestion: error.context.suggestion || 'Please enter the flight date manually'
      });
      requiresManualEntry.push('date');
      return { success: false, errors, requiresManualEntry };
    }
  }
  
  // 4. TIME EXTRACTION (Timezone-aware)
  const timeOrder = getAirlineTimeOrder(result.airlineCode || 'default');
  
  // Departure time
  const departureResult = safeParseTime(normalizedText, result.origin.airportCode, 'departure');
  if (departureResult.success && departureResult.time) {
    result.scheduledDepartureTime = departureResult.time;
    result.origin.timezone = departureResult.timezone;
  } else {
    errors.push({
      field: 'departureTime',
      code: departureResult.error?.code || 'TIME_PARSE_FAILED',
      message: departureResult.error?.message || 'Could not extract departure time',
      suggestion: departureResult.error?.suggestion || 'Please enter departure time manually'
    });
    requiresManualEntry.push('departureTime');
  }
  
  // Arrival time
  const arrivalResult = safeParseTime(normalizedText, result.destination.airportCode, 'arrival');
  if (arrivalResult.success && arrivalResult.time) {
    result.scheduledArrivalTime = arrivalResult.time;
    result.destination.timezone = arrivalResult.timezone;
  } else if (result.scheduledDepartureTime) {
    // Estimate arrival based on route
    try {
      result.scheduledArrivalTime = estimateArrivalTime(
        result.scheduledDepartureTime,
        result.origin.airportCode,
        result.destination.airportCode
      );
      result.arrivalTimeEstimated = true;
    } catch (error) {
      errors.push({
        field: 'arrivalTime',
        code: 'ESTIMATION_FAILED',
        message: 'Could not estimate arrival time',
        suggestion: 'Please enter arrival time manually'
      });
      requiresManualEntry.push('arrivalTime');
    }
  }
  
  // Boarding time (optional)
  const boardingResult = safeParseTime(normalizedText, result.origin.airportCode, 'boarding');
  if (boardingResult.success && boardingResult.time) {
    result.boardingTime = boardingResult.time;
  }
  
  // 5. OPTIONAL FIELDS
  if (extractedData.seat) {
    result.seatNumber = extractedData.seat;
  }
  
  if (extractedData.gate) {
    result.origin.gate = extractedData.gate;
  }
  
  // Extract confirmation code
  const confirmationMatch = normalizedText.match(/(?:CONF|PNR|REF)\s*:?\s*([A-Z0-9]{5,7})/);
  if (confirmationMatch) {
    result.confirmationCode = confirmationMatch[1];
  }
  
  // 6. METADATA
  result.extractionMetadata = {
    confidence: validation.cleanText ? 0.8 : 0.5,
    warnings: errors.filter(e => !requiresManualEntry.includes(e.field)),
    timestamp: new Date().toISOString(),
    timeOrder: timeOrder,
    estimatedFields: result.arrivalTimeEstimated ? ['arrivalTime'] : []
  };
  
  // Determine success
  const criticalFieldsMissing = requiresManualEntry.filter(f => 
    ['origin', 'destination', 'date', 'departureTime'].includes(f)
  );
  
  if (criticalFieldsMissing.length > 0) {
    return {
      success: false,
      data: result,
      errors,
      requiresManualEntry
    };
  }
  
  return {
    success: true,
    data: result,
    errors: errors.length > 0 ? errors : undefined,
    requiresManualEntry: requiresManualEntry.length > 0 ? requiresManualEntry : undefined
  };
}

function getAirlineName(code: string): string {
  const airlines: Record<string, string> = {
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'UA': 'United Airlines',
    'WN': 'Southwest Airlines',
    'B6': 'JetBlue Airways',
    'AS': 'Alaska Airlines',
    'NK': 'Spirit Airlines',
    'F9': 'Frontier Airlines',
    'HA': 'Hawaiian Airlines',
    'FR': 'Ryanair',
    'U2': 'easyJet',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM'
  };
  
  return airlines[code] || 'Other';
}