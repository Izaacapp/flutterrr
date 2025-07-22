import axios from 'axios';
import FormData from 'form-data';
import { validateBoardingPass, ValidationResult } from './boardingPassValidator';

// SimpleTex API configuration
const SIMPLETEX_API_URL = 'https://server.simpletex.net/api/latex_ocr';
const SIMPLETEX_API_KEY = process.env.SIMPLETEX_API_KEY || '';

interface SimpletexResponse {
  status: string;
  res: string;
  error?: string;
  confidence?: Array<{ word: string; confidence: number }>;
}

export async function parseBoardingPassWithSimpletex(buffer: Buffer, mimeType: string): Promise<any | null> {
  try {
    console.log('Using SimpleTex OCR API...');
    
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
      
      // Validate and parse using the validation layer
      const validation = validateBoardingPass({
        text: data.res,
        confidence: data.confidence
      });
      
      console.log('Validation Result:', JSON.stringify(validation, null, 2));
      
      // If validation found good data, use it
      if (Object.keys(validation.extractedData).length > 0) {
        const enhancedData = convertValidationToFlightData(validation);
        if (enhancedData) {
          return enhancedData;
        }
      }
      
      // Fallback to original parser if validation didn't work well
      return parseOCRText(data.res);
    } else {
      console.error('SimpleTex OCR failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('SimpleTex API Error:', error);
    return null;
  }
}

function parseOCRText(text: string): any | null {
  // Clean and normalize text
  const normalizedText = text.toUpperCase().replace(/\s+/g, ' ').trim();
  
  console.log('Parsing SimpleTex OCR text:', normalizedText);
  
  const result: any = {
    status: 'upcoming'
  };
  
  // Extract airports - look for various patterns
  const airportPatterns = [
    /\b([A-Z]{3})\s+TO\s+([A-Z]{3})\b/,
    /\b([A-Z]{3})\s*[-–—]\s*([A-Z]{3})\b/,
    /\b([A-Z]{3})\s+\d+H\s+\d+M\s*\|\s*\w+\s+([A-Z]{3})\b/i,
    /FROM\s+([A-Z]{3})\s+TO\s+([A-Z]{3})/,
    /DEPART\s+([A-Z]{3}).*ARRIVE\s+([A-Z]{3})/
  ];
  
  for (const pattern of airportPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.origin = {
        airportCode: match[1],
        city: match[1] // Will be enriched later
      };
      result.destination = {
        airportCode: match[2],
        city: match[2] // Will be enriched later
      };
      break;
    }
  }
  
  // If no route pattern found, look for individual airports
  if (!result.origin || !result.destination) {
    const commonAirports = ['JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'SFO', 'MIA', 'SEA', 'BOS', 'EWR', 
                          'LGA', 'DCA', 'IAD', 'PHX', 'LAS', 'MCO', 'DEN', 'DTW', 'MSP', 'SLC',
                          'BWI', 'MDW', 'DAL', 'HOU', 'BNA', 'AUS', 'PDX', 'SAN', 'TPA', 'FLL'];
    
    const airportMatches = normalizedText.match(/\b([A-Z]{3})\b/g) || [];
    const foundAirports = airportMatches.filter(code => commonAirports.includes(code));
    
    if (foundAirports.length >= 2) {
      result.origin = {
        airportCode: foundAirports[0],
        city: foundAirports[0]
      };
      result.destination = {
        airportCode: foundAirports[1],
        city: foundAirports[1]
      };
    }
  }
  
  // Extract flight number
  const flightPatterns = [
    /FLIGHT\s*:?\s*([A-Z]{2}\s*\d{1,4})/,
    /FLT\s*:?\s*([A-Z]{2}\s*\d{1,4})/,
    /\b([A-Z]{2})\s*(\d{3,4})\b/
  ];
  
  for (const pattern of flightPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.flightNumber = match[1].replace(/\s+/g, '');
      // Extract airline from flight number
      const airlineCode = match[1].match(/^[A-Z]{2}/);
      if (airlineCode) {
        result.airline = getAirlineName(airlineCode[0]);
      }
      break;
    }
  }
  
  // Extract times - handle various formats including with dashes
  const timePatterns = {
    departure: [
      /[-\s]*DEPART(?:URE)?\s*TIME\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /DEPART(?:URE)?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /DEP\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /LEAVES?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i
    ],
    arrival: [
      /[-\s]*ARRIV(?:AL)?\s*TIME\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /ARRIV(?:AL)?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /ARR\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /LANDS?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i
    ],
    boarding: [
      /[-\s]*BOARDING\s*TIME\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /BOARDS?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
      /BOARD\s*BY\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i
    ]
  };
  
  // Find departure time
  for (const pattern of timePatterns.departure) {
    const match = normalizedText.match(pattern);
    if (match) {
      const date = extractDate(normalizedText) || new Date();
      result.scheduledDepartureTime = parseDateTime(date, match[1]);
      break;
    }
  }
  
  // Find arrival time
  for (const pattern of timePatterns.arrival) {
    const match = normalizedText.match(pattern);
    if (match) {
      const date = extractDate(normalizedText) || new Date();
      result.scheduledArrivalTime = parseDateTime(date, match[1]);
      break;
    }
  }
  
  // Find boarding time
  let boardingTime = null;
  for (const pattern of timePatterns.boarding) {
    const match = normalizedText.match(pattern);
    if (match) {
      boardingTime = match[1];
      break;
    }
  }
  
  // If times not found with context, look for any times
  if (!result.scheduledDepartureTime || !result.scheduledArrivalTime) {
    const genericTimes = normalizedText.match(/(\d{1,2}:\d{2}\s*[AP]M?)/gi) || [];
    const date = extractDate(normalizedText) || new Date();
    
    // Filter out boarding time from generic times
    const nonBoardingTimes = genericTimes.filter(time => 
      !boardingTime || time.toUpperCase() !== boardingTime.toUpperCase()
    );
    
    // If we have boarding time and other times, departure is usually after boarding
    if (boardingTime && nonBoardingTimes.length > 0) {
      // Find the time that comes after boarding time
      const boardingDate = parseDateTime(date, boardingTime);
      const timesWithDates = nonBoardingTimes.map(t => ({
        time: t,
        date: parseDateTime(date, t)
      }));
      
      // Sort by time
      timesWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Departure is usually the first time after boarding
      if (!result.scheduledDepartureTime && timesWithDates.length > 0) {
        result.scheduledDepartureTime = timesWithDates[0].date;
      }
      if (!result.scheduledArrivalTime && timesWithDates.length > 1) {
        result.scheduledArrivalTime = timesWithDates[1].date;
      }
    } else {
      // Fallback to original logic
      if (nonBoardingTimes.length > 0 && !result.scheduledDepartureTime) {
        result.scheduledDepartureTime = parseDateTime(date, nonBoardingTimes[0]);
      }
      if (nonBoardingTimes.length > 1 && !result.scheduledArrivalTime) {
        result.scheduledArrivalTime = parseDateTime(date, nonBoardingTimes[1]);
      }
    }
    
    // Final fallback - estimate arrival time
    if (result.scheduledDepartureTime && !result.scheduledArrivalTime) {
      // Estimate arrival as 2 hours after departure
      result.scheduledArrivalTime = new Date(new Date(result.scheduledDepartureTime).getTime() + 2 * 60 * 60 * 1000);
    }
  }
  
  // Extract seat
  const seatMatch = normalizedText.match(/SEAT\s*:?\s*(\d{1,3}[A-F])/i);
  if (seatMatch) {
    result.seatNumber = seatMatch[1];
  }
  
  // Extract gate
  const gateMatch = normalizedText.match(/GATE\s*:?\s*([A-Z]?\d{1,3}[A-Z]?)/i);
  if (gateMatch && result.origin) {
    result.origin.gate = gateMatch[1];
  }
  
  // Extract confirmation code
  const confirmationPatterns = [
    /CONF(?:IRMATION)?\s*:?\s*([A-Z0-9]{5,7})/,
    /PNR\s*:?\s*([A-Z0-9]{5,7})/,
    /REF\s*:?\s*([A-Z0-9]{5,7})/
  ];
  
  for (const pattern of confirmationPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.confirmationCode = match[1];
      break;
    }
  }
  
  // Validate minimum required data
  if (!result.origin?.airportCode || !result.destination?.airportCode) {
    console.error('Could not extract required airports from OCR text');
    return null;
  }
  
  if (!result.scheduledDepartureTime) {
    result.scheduledDepartureTime = new Date();
  }
  
  return result;
}

function extractDate(text: string): Date | null {
  const monthMap: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
    'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'JUNE': 5,
    'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
  };
  
  // Try different date patterns
  const patterns = [
    // October 9, 2013
    /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s*(\d{4})/i,
    // 9 OCT 2013 or 09 OCT 13
    /(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?/i,
    // 10/09/2013 or 10-09-2013
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let day, month, year;
      
      if (pattern.source.includes('JANUARY')) {
        // Full month name pattern
        month = monthMap[match[1].toUpperCase()];
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (pattern.source.includes('JAN')) {
        // Abbreviated month pattern
        day = parseInt(match[1]);
        month = monthMap[match[2].toUpperCase()];
        year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      } else {
        // Numeric date pattern (assume MM/DD/YYYY)
        month = parseInt(match[1]) - 1; // JavaScript months are 0-based
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      if (year < 100) {
        year += 2000;
      }
      
      return new Date(year, month, day);
    }
  }
  
  return null;
}

function parseDateTime(date: Date, timeStr: string): Date {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M?)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    if (period) {
      if (period.toUpperCase().startsWith('P') && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase().startsWith('A') && hours === 12) {
        hours = 0;
      }
    }
    
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
  
  return date;
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
    'HA': 'Hawaiian'
  };
  
  return airlines[code] || 'Other';
}

// Convert validation result to flight data format
function convertValidationToFlightData(validation: any): any | null {
  const { extractedData } = validation;
  
  // Require minimum data
  if (!extractedData.origin || !extractedData.destination) {
    return null;
  }
  
  const result: any = {
    status: 'upcoming'
  };
  
  // Set airports
  result.origin = {
    airportCode: extractedData.origin,
    city: extractedData.origin // Will be enriched later
  };
  
  result.destination = {
    airportCode: extractedData.destination,
    city: extractedData.destination // Will be enriched later
  };
  
  // Set flight number and airline
  if (extractedData.flightNumber) {
    result.flightNumber = extractedData.flightNumber;
    const airlineCode = extractedData.flightNumber.match(/^[A-Z]{2}/)?.[0];
    if (airlineCode) {
      result.airline = getAirlineName(airlineCode);
    }
  }
  
  // Handle dates and times
  const flightDate = extractedData.date ? 
    extractDate(extractedData.date) : 
    new Date();
  
  if (extractedData.departureTime) {
    result.scheduledDepartureTime = parseDateTime(flightDate || new Date(), extractedData.departureTime);
  } else {
    result.scheduledDepartureTime = flightDate || new Date();
  }
  
  if (extractedData.arrivalTime) {
    result.scheduledArrivalTime = parseDateTime(flightDate || new Date(), extractedData.arrivalTime);
  } else {
    // Estimate arrival as 2 hours after departure
    result.scheduledArrivalTime = new Date(result.scheduledDepartureTime.getTime() + 2 * 60 * 60 * 1000);
  }
  
  // Set optional fields
  if (extractedData.seat) {
    result.seatNumber = extractedData.seat;
  }
  
  if (extractedData.gate) {
    result.origin.gate = extractedData.gate;
  }
  
  return result;
}