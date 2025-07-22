import { strictDateExtraction } from "./dateStrict";
import { safeStrictDateExtraction } from "./dateStrict";
import axios from 'axios';
import FormData from 'form-data';
import { validateBoardingPass } from './boardingPassValidator';
import { extractFlightTimes, getAirportTimezone } from '../services/timeHandling.service';

// SimpleTex API configuration
const SIMPLETEX_API_URL = 'https://server.simpletex.net/api/latex_ocr';
const SIMPLETEX_API_KEY = process.env.SIMPLETEX_API_KEY || '';

interface SimpletexResponse {
  status: string;
  res: string;
  error?: string;
  confidence?: Array<{ word: string; confidence: number }>;
}

export async function parseBoardingPassWithSimpletexV2(buffer: Buffer, mimeType: string): Promise<any | null> {
  try {
    console.log('Using SimpleTex OCR API V2 with improved time handling...');
    
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
      
      console.log('Validation Result:', JSON.stringify(validation, null, 2));
      
      // Parse with improved time handling
      return parseOCRTextV2(data.res, validation);
    } else {
      console.error('SimpleTex OCR failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('SimpleTex API Error:', error);
    return null;
  }
}

function parseOCRTextV2(text: string, validation: any): any | null {
  const normalizedText = text.toUpperCase().replace(/\s+/g, ' ').trim();
  console.log('Parsing OCR text with V2 time handling...');
  
  const result: any = {
    status: 'upcoming'
  };
  
  // Extract basic data from validation
  const { extractedData } = validation;
  
  // Airports (required)
  if (!extractedData.origin || !extractedData.destination) {
    console.error('Missing required airports');
    return null;
  }
  
  result.origin = {
    airportCode: extractedData.origin,
    city: extractedData.origin // Will be enriched later
  };
  
  result.destination = {
    airportCode: extractedData.destination,
    city: extractedData.destination // Will be enriched later
  };
  
  // Flight info
  if (extractedData.flightNumber) {
    result.flightNumber = extractedData.flightNumber;
    const airlineCode = extractedData.flightNumber.match(/^[A-Z]{2}/)?.[0];
    if (airlineCode) {
      result.airline = getAirlineName(airlineCode);
    }
  }
  
  // Extract date (required for time parsing)
  const flightDate = extractedData.date ? 
    parseDate(extractedData.date) : 
    extractDateFromText(normalizedText);
  
  if (!flightDate) {
    console.error('No date found in boarding pass');
    return null;
  }
  
  // Use new time extraction service
  const timeData = extractFlightTimes(
    normalizedText,
    flightDate,
    result.origin.airportCode,
    result.destination.airportCode,
    result.flightNumber?.substring(0, 2)
  );
  
  console.log('Time extraction result:', timeData);
  
  // Handle time extraction results
  if (timeData.errors && timeData.errors.length > 0) {
    console.warn('Time extraction warnings:', timeData.errors);
  }
  
  if (!timeData.departure) {
    console.error('Failed to extract departure time');
    return null;
  }
  
  result.scheduledDepartureTime = timeData.departure;
  result.scheduledArrivalTime = timeData.arrival || new Date(timeData.departure.getTime() + 2 * 60 * 60 * 1000);
  
  // Add timezone info
  if (timeData.timezone) {
    result.origin.timezone = timeData.timezone;
  }
  
  const destTimezone = getAirportTimezone(result.destination.airportCode);
  if (destTimezone) {
    result.destination.timezone = destTimezone;
  }
  
  // Optional fields
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
  
  // Add extraction metadata
  result.extractionMetadata = {
    confidence: timeData.confidence,
    warnings: timeData.errors || [],
    method: 'simpletex_v2',
    timestamp: strictDateExtraction()
  };
  
  return result;
}

function parseDate(dateStr: string): Date | null {
  // Try multiple date formats
  const patterns = [
    // ISO format
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // US format
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // European format
    /(\d{1,2})-(\d{1,2})-(\d{4})/
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      // Parse based on pattern
      let year, month, day;
      if (pattern.source.includes('\\d{4})-')) {
        // ISO format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // US/EU format
        month = parseInt(match[1]) - 1;
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      return new Date(year, month, day);
    }
  }
  
  // Try text format (e.g., "15 MAR 2024")
  return extractDateFromText(dateStr);
}

function extractDateFromText(text: string): Date | null {
  const monthMap: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
    'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'JUNE': 5,
    'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
  };
  
  // Try different patterns
  const patterns = [
    // Full month: October 9, 2024
    /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s*(\d{4})/i,
    // Abbreviated: 15 MAR 2024
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i,
    // Abbreviated no year: 15 MAR
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let day, month, year;
      
      if (pattern.source.includes('JANUARY')) {
        // Full month name
        month = monthMap[match[1].toUpperCase()];
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (match[3]) {
        // DD MMM YYYY
        day = parseInt(match[1]);
        month = monthMap[match[2].toUpperCase()];
        year = parseInt(match[3]);
      } else {
        // DD MMM (no year)
        day = parseInt(match[1]);
        month = monthMap[match[2].toUpperCase()];
        year = strictDateExtraction().getFullYear();
        
        // If date is in past, assume next year
        const testDate = new Date(year, month, day);
        if (testDate < strictDateExtraction()) {
          year++;
        }
      }
      
      return new Date(year, month, day);
    }
  }
  
  return null;
}

function getAirlineName(code: string): string {
  const airlines: Record<string, string> = {
    'AA': 'American',
    'DL': 'Delta',
    'UA': 'United',
    'WN': 'Southwest',
    'B6': 'JetBlue',
    'AS': 'Alaska',
    'NK': 'Spirit',
    'F9': 'Frontier',
    'HA': 'Hawaiian',
    'FR': 'Ryanair',
    'U2': 'easyJet',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM'
  };
  
  return airlines[code] || 'Other';
}