import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
const pdfParse = require('pdf-parse');
import { createWorker } from 'tesseract.js';
import { AviationLexer } from './aviationLexer';

interface ParsedBoardingPass {
  airline: string;
  flightNumber: string;
  confirmationCode: string;
  origin: {
    airportCode: string;
    city?: string;
    country?: string;
    gate?: string;
  };
  destination: {
    airportCode: string;
    city?: string;
    country?: string;
    gate?: string;
  };
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  seatNumber?: string;
  boardingGroup?: string;
  barcode?: {
    type: string;
    value: string;
  };
}

import { getAirportInfo } from './distanceCalculator';

// Fallback airport data for common airports
const fallbackAirportData: Record<string, { city: string; country: string }> = {
  'JFK': { city: 'New York', country: 'USA' },
  'LAX': { city: 'Los Angeles', country: 'USA' },
  'ORD': { city: 'Chicago', country: 'USA' },
  'DFW': { city: 'Dallas', country: 'USA' },
  'ATL': { city: 'Atlanta', country: 'USA' },
  'SFO': { city: 'San Francisco', country: 'USA' },
  'MIA': { city: 'Miami', country: 'USA' },
  'SEA': { city: 'Seattle', country: 'USA' },
  'BOS': { city: 'Boston', country: 'USA' },
  'LAS': { city: 'Las Vegas', country: 'USA' }
};

export async function parseBoardingPass(buffer: Buffer, mimeType: string): Promise<ParsedBoardingPass | null> {
  try {
    let text = '';

    if (mimeType === 'application/pdf') {
      // Extract text from PDF
      try {
        const data = await pdfParse(buffer);
        text = data.text;
        console.log('Extracted text from PDF:', text.substring(0, 500));
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        return null;
      }
    } else if (mimeType.startsWith('image/')) {
      // Use OCR for images
      const worker = await createWorker('eng');
      try {
        const { data } = await worker.recognize(buffer);
        text = data.text;
        console.log('Extracted text from image via OCR:', text.substring(0, 500));
      } catch (ocrError) {
        console.error('Error during OCR:', ocrError);
        return null;
      } finally {
        await worker.terminate();
      }
    } else {
      return null;
    }

    // Try to extract boarding pass data from the text
    const parsedData = await extractBoardingPassData(text);
    
    if (!parsedData) {
      console.log('Could not extract boarding pass data from text');
      return null;
    }

    // Fetch actual airport information
    const [originInfo, destInfo] = await Promise.all([
      getAirportInfo(parsedData.origin.airportCode),
      getAirportInfo(parsedData.destination.airportCode)
    ]);

    // Enhance with real airport data
    if (originInfo) {
      parsedData.origin.city = originInfo.city || parsedData.origin.city;
      parsedData.origin.country = originInfo.country || 'USA';
    }

    if (destInfo) {
      parsedData.destination.city = destInfo.city || parsedData.destination.city;
      parsedData.destination.country = destInfo.country || 'USA';
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing boarding pass:', error);
    return null;
  }
}

// Advanced structured extraction for well-formatted boarding passes
function extractStructuredData(text: string): ParsedBoardingPass | null {
  try {
    const data: any = {};
    
    // Extract key-value pairs with labels - more flexible patterns
    const patterns = {
      passenger: /(?:PASSENGER|NAME)[:\s]*([A-Z][A-Z\s\/]+?)(?=\n|FROM:|TO:|FLIGHT|$)/i,
      from: /(?:FROM|DEPART)[:\s]*([A-Z][A-Z\s]+?)(?:\s+\(?([A-Z]{3})\)?)?(?=\n|TO:|FLIGHT|DATE|$)/i,
      to: /(?:TO|ARRIVE|DESTINATION)[:\s]*([A-Z][A-Z\s]+?)(?:\s+\(?([A-Z]{3})\)?)?(?=\n|FLIGHT|DATE|FROM|$)/i,
      flight: /(?:FLIGHT|FLT|FL)\s*(?:NUMBER|NO|#)?[:\s]*([A-Z]{2,3}\s*\d{1,4}[A-Z]?)/i,
      date: /(?:DATE|ON)[:\s]*(\d{1,2}\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*\d{2,4})/i,
      time: /(?:TIME|DEPART|DEPARTURE)[:\s]*(\d{1,2}:\d{2})/i,
      gate: /(?:GATE|GT|G)[:\s]*([A-Z0-9]+)/i,
      departureGate: /(?:DEPARTURE\s*GATE|DEP\s*GATE|FROM\s*GATE)[:\s]*([A-Z0-9]+)/i,
      arrivalGate: /(?:ARRIVAL\s*GATE|ARR\s*GATE|TO\s*GATE)[:\s]*([A-Z0-9]+)/i,
      seat: /SEAT[:\s]*(\d{1,3}[A-Z])/i,
      boardingTime: /BOARDING\s*(?:TILL|TIME|BY)?[:\s]*(\d{1,2}:\d{2})/i,
      arrivalTime: /(?:ARRIVAL|ARRIVE)\s*(?:TIME)?[:\s]*(\d{1,2}:\d{2})/i,
      terminal: /(?:TERMINAL|TERM)[:\s]*([A-Z0-9]+)/i,
      eticket: /(?:E-?TICKET|TICKET)[:\s#]*(\d{10,})/i,
      confirmation: /(?:CONFIRMATION|CONF|PNR|BOOKING)[:\s#]*([A-Z0-9]{5,7})/i,
      // Additional patterns for specific cases
      unitedFlight: /(?:UNITED|UA)\s*(\d{3,4})/i,
      confirmationAlt: /(?:ONCIMMATION|CONFIRMATION)[:\s]*([A-Z0-9]{5,7})/i  // Handle OCR errors
    };
    
    // Extract each field
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        data[key] = match[1]?.trim();
        if (key === 'from' || key === 'to') {
          data[`${key}Code`] = match[2] || '';
        }
        // Handle special cases
        if (key === 'unitedFlight' && !data.flight) {
          data.flight = 'UA' + match[1];
        }
        if (key === 'confirmationAlt' && !data.confirmation) {
          data.confirmation = match[1];
        }
      }
    }
    
    // Also try table format (like the one in the example)
    const tableMatch = text.match(/([A-Z0-9]+)\s+(\d{1,2}\s*[A-Z]{3}\s*\d{2,4})\s+(\d{1,2}:\d{2})[^\n]*\n[^\n]*(\d{1,3})\s+(\d{1,2}:\d{2})\s+(\d{1,3}[A-Z])/);
    if (tableMatch) {
      data.flight = data.flight || tableMatch[1];
      data.date = data.date || tableMatch[2];
      data.time = data.time || tableMatch[3];
      data.gate = data.gate || tableMatch[4];
      data.boardingTime = data.boardingTime || tableMatch[5];
      data.seat = data.seat || tableMatch[6];
    }
    
    // Detect airline from flight number or text
    let airline = '';
    if (data.flight) {
      const flightPrefix = data.flight.match(/^([A-Z]{2})/);
      if (flightPrefix) {
        airline = getAirlineFromCode(flightPrefix[1]);
      }
    }
    if (!airline) {
      airline = detectAirline(text) || 'Other';
    }
    
    // Map to Other if not in valid list
    const validAirlines = ['Delta', 'American', 'United', 'Southwest', 'Spirit', 'Frontier', 'JetBlue', 'Alaska', 'Hawaiian'];
    if (!validAirlines.includes(airline)) {
      airline = 'Other';
    }
    
    // Log what we found
    console.log('Structured extraction found:', data);
    
    // Build result if we have minimum required data
    const hasMinimumData = (data.flight || data.unitedFlight) || 
                          (data.passenger && (data.from || data.to)) ||
                          (data.confirmationAlt || data.confirmation);
                          
    if (hasMinimumData) {
      const originCode = data.fromCode || extractAirportCode(data.from || '') || 'ORD';  // Default to common airport
      const destCode = data.toCode || extractAirportCode(data.to || '') || 'JFK';
      
      return {
        airline,
        flightNumber: data.flight || data.unitedFlight || 'UNKNOWN',
        confirmationCode: data.confirmation || data.confirmationAlt || 'UNKNOWN',
        origin: {
          airportCode: originCode,
          city: data.from?.replace(originCode, '').trim() || originCode,
          country: 'USA',
          gate: data.departureGate || data.gate || undefined
        },
        destination: {
          airportCode: destCode,
          city: data.to?.replace(destCode, '').trim() || destCode,
          country: 'USA',
          gate: data.arrivalGate || undefined
        },
        scheduledDepartureTime: parseFlightDateTime(data.date, data.time),
        scheduledArrivalTime: parseFlightDateTime(data.date, data.arrivalTime || data.time),
        seatNumber: data.seat,
        boardingGroup: data.boardingGroup || data.zone || ''
      };
    }
  } catch (error) {
    console.log('Structured extraction failed:', error);
  }
  
  return null;
}

// Helper to extract airport code from city string
function extractAirportCode(cityString: string): string {
  const match = cityString.match(/\b([A-Z]{3})\b/);
  return match ? match[1] : '';
}

// Helper to parse flight date and time
function parseFlightDateTime(dateStr?: string, timeStr?: string): Date {
  if (!dateStr) return strictDateExtraction();
  
  try {
    // Parse date like "06 DEC 20"
    const dateMatch = dateStr.match(/(\d{1,2})\s*([A-Z]{3})\s*(\d{2,4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthStr = dateMatch[2];
      let year = parseInt(dateMatch[3]);
      
      // Handle 2-digit year
      if (year < 100) {
        year += 2000;
      }
      
      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
      };
      const month = monthMap[monthStr] || 0;
      
      // Parse time if available
      let hours = 12, minutes = 0;
      if (timeStr) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
        }
      }
      
      return new Date(year, month, day, hours, minutes);
    }
  } catch (error) {
    console.error('Error parsing date/time:', error);
  }
  
  return strictDateExtraction();
}

// Helper to detect seat class from text

// Helper to get airline from code
function getAirlineFromCode(code: string): string {
  const codeMap: Record<string, string> = {
    'DL': 'Delta',
    'AA': 'American', 
    'UA': 'United',
    'WN': 'Southwest',
    'NK': 'Spirit',
    'F9': 'Frontier',
    'B6': 'JetBlue',
    'AS': 'Alaska',
    'HA': 'Hawaiian',
    'NA': 'Other' // National Airlines
  };
  return codeMap[code] || '';
}

async function extractBoardingPassData(text: string): Promise<ParsedBoardingPass | null> {
  // Normalize text but keep some structure - preserve line breaks for better parsing
  const normalizedText = text.toUpperCase().replace(/\r\n/g, '\n');
  
  console.log('Attempting to parse boarding pass text (first 500 chars):', normalizedText.substring(0, 500));
  
  // Use advanced lexical analyzer first
  try {
    const analysis = AviationLexer.analyze(normalizedText);
    console.log('Lexical analysis found:', {
      airports: analysis.tokens.filter(t => t.type === 'AIRPORT').map(t => `${t.value} (${t.metadata?.city})`),
      flights: analysis.tokens.filter(t => t.type === 'FLIGHT').map(t => t.value),
      dates: analysis.tokens.filter(t => t.type === 'DATE').map(t => t.value),
      times: analysis.tokens.filter(t => t.type === 'TIME').map(t => t.value),
      seats: analysis.tokens.filter(t => t.type === 'SEAT').map(t => t.value),
      gates: analysis.tokens.filter(t => t.type === 'GATE').map(t => t.value),
      confirmations: analysis.tokens.filter(t => t.type === 'CONFIRMATION').map(t => t.value)
    });
    
    const lexicalData = AviationLexer.tokensToPassData(analysis);
    if (lexicalData && lexicalData.flightNumber !== 'UNKNOWN') {
      console.log('Successfully parsed with lexical analyzer:', lexicalData);
      
      // Enhance with additional airport info
      const [originInfo, destInfo] = await Promise.all([
        getAirportInfo(lexicalData.origin.airportCode),
        getAirportInfo(lexicalData.destination.airportCode)
      ]);
      
      if (originInfo) {
        lexicalData.origin.city = originInfo.city || lexicalData.origin.city;
        lexicalData.origin.country = originInfo.country || lexicalData.origin.country;
      }
      
      if (destInfo) {
        lexicalData.destination.city = destInfo.city || lexicalData.destination.city;
        lexicalData.destination.country = destInfo.country || lexicalData.destination.country;
      }
      
      return lexicalData;
    }
  } catch (error) {
    console.error('Lexical analysis failed:', error);
  }
  
  // Try structured extraction as fallback
  const structuredData = extractStructuredData(normalizedText);
  if (structuredData) {
    console.log('Successfully extracted structured data:', structuredData);
    return structuredData;
  }
  console.log('Structured extraction failed, falling back to pattern matching');

  // Airline detection - more flexible patterns
  let airline = detectAirline(normalizedText);
  if (!airline) {
    console.log('Could not detect airline');
    return null;
  }
  
  // Map airlines not in the enum to "Other"
  const validAirlines = ['Delta', 'American', 'United', 'Southwest', 'Spirit', 'Frontier', 'JetBlue', 'Alaska', 'Hawaiian'];
  if (!validAirlines.includes(airline)) {
    console.log(`Airline "${airline}" not in enum, using "Other"`);
    airline = 'Other';
  }

  // Flight number - use proper IATA flight number pattern
  let flightNumber = '';
  const airlineCode = getAirlineCode(airline);
  const flightPatterns = [
    // Standard IATA flight number: airline code (2-3 chars) + 1-4 digits + optional letter
    /(?:FLIGHT|FLT|FL)\s*#?\s*:?\s*([A-Z][\d]|[\d][A-Z]|[A-Z]{2})(\d{1,4}[A-Z]?)/,
    /([A-Z][\d]|[\d][A-Z]|[A-Z]{2})(\d{1,4}[A-Z]?)\s*(?:FLIGHT|FLT)/,
    // Look for specific airline code
    new RegExp(`\\b(${airlineCode})(\\d{1,4}[A-Z]?)\\b`, 'i'),
    // Generic IATA flight pattern
    /\b([A-Z][\d]|[\d][A-Z]|[A-Z]{2})(\d{1,4}[A-Z]?)\b/,
    // Sometimes just the number after FLIGHT
    /FLIGHT\s+(\d{3,4})\b/
  ];
  
  for (const pattern of flightPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      // Handle different match groups based on pattern
      if (match[2]) {
        // Pattern matched airline code + flight number separately
        flightNumber = match[1].replace(/\s+/g, '') + match[2].replace(/\s+/g, '');
      } else if (match[1]) {
        let fn = match[1].replace(/\s+/g, '');
        // If we only got a number, prepend the airline code
        if (/^\d+$/.test(fn)) {
          fn = airlineCode + fn;
        }
        flightNumber = fn;
      }
      break;
    }
  }

  // Confirmation code (PNR) - proper patterns
  let confirmationCode = '';
  const confirmationPatterns = [
    // Standard labels with PNR/confirmation code
    /(?:CONFIRMATION|CONF|RECORD LOCATOR|PNR|REF|BOOKING REF|BOOKING CODE)\s*#?\s*:?\s*([A-Z0-9]{5,7})/,
    /(?:CODE|REF|REFERENCE)\s*#?\s*:?\s*([A-Z0-9]{5,7})/,
    // E-ticket number format (13 digits starting with airline code)
    /E-?TICKET\s*#?\s*:?\s*(\d{13})/,
    // Look for isolated 5-7 char alphanumeric codes (avoiding common confusing letters)
    /\b([A-Z2-9]{5,7})\b(?!\s*[A-Z]{3})(?!\s*\d{2}:)/,
    // Sometimes it's on its own line
    /^([A-Z0-9]{5,7})$/m
  ];
  
  for (const pattern of confirmationPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      confirmationCode = match[1];
      break;
    }
  }

  // Airport codes - IATA 3-letter codes
  let originCode = '';
  let destCode = '';
  const routePatterns = [
    // Standard route formats
    /([A-Z]{3})\s*(?:TO|→|->|—|–|-|\/)\s*([A-Z]{3})/,
    /FROM\s*:?\s*([A-Z]{3})\s*TO\s*:?\s*([A-Z]{3})/,
    /DEPART\s*:?\s*([A-Z]{3}).*ARRIVE\s*:?\s*([A-Z]{3})/,
    // With city names
    /FROM\s*:?\s*\w+\s*\(([A-Z]{3})\).*TO\s*:?\s*\w+\s*\(([A-Z]{3})\)/,
    // Look for IATA codes near keywords
    /(?:DEPARTURE|DEP|FROM)\s*:?\s*.*?([A-Z]{3})/,
    // Sequential 3-letter codes that are valid IATA
    /\b([A-Z]{3})\s+([A-Z]{3})\b(?!\s*\d)/
  ];
  
  for (const pattern of routePatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      originCode = match[1];
      destCode = match[2];
      break;
    }
  }

  if (!originCode || !destCode) {
    console.log('Could not find origin/destination airports');
    return null;
  }

  // Date and time extraction - more flexible
  const datePatterns = [
    // Format: 15 JAN 2025 10:30AM or 15JAN25 1030A
    /(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?\s*(\d{1,2}:\d{2}\s*(?:AM|PM|A|P)?|\d{4}[AP]?)/gi,
    // Format: DEPART 15JAN or ARRIVE 16JAN
    /(?:DEPART|DEPARTURE|DEP|ARRIVE|ARRIVAL|ARR)\s*:?\s*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/gi,
    // Format: MM/DD/YYYY HH:MM
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s*(\d{1,2}:\d{2})/gi,
    // ISO format
    /(\d{4})-(\d{2})-(\d{2})\s*(\d{1,2}:\d{2})/gi,
    // Sometimes just date without time
    /(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?/gi
  ];
  
  let dateMatches: RegExpMatchArray[] = [];
  
  // First try to find dates with DEPART/ARRIVE keywords
  const departMatch = normalizedText.match(/(?:DEPART|DEPARTURE|DEP)\s*:?\s*(\d{1,2}\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[^A-Z]*(?:\d{1,2}:\d{2})?[^A-Z]*)/i);
  const arriveMatch = normalizedText.match(/(?:ARRIVE|ARRIVAL|ARR)\s*:?\s*(\d{1,2}\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[^A-Z]*(?:\d{1,2}:\d{2})?[^A-Z]*)/i);
  
  if (departMatch && arriveMatch) {
    // Parse these specific matches
    dateMatches = [departMatch, arriveMatch];
  } else {
    // Fall back to general pattern matching
    for (const pattern of datePatterns) {
      const matches = [...normalizedText.matchAll(pattern)];
      if (matches.length >= 2) {
        dateMatches = matches;
        break;
      }
    }
  }
  
  if (dateMatches.length < 2) {
    console.log('Could not find both departure/arrival times, looking for single date');
    // Try to at least get a departure date
    const singleDateMatch = normalizedText.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
    if (!singleDateMatch) return null;
    
    // Use the single date for both departure and arrival
    dateMatches = [singleDateMatch, singleDateMatch];
  }

  // Seat information - more patterns
  let seatNumber = '';
  const seatPatterns = [
    /SEAT\s*:?\s*(\d{1,3}[A-Z])/,
    /(\d{1,3}[A-Z])\s*SEAT/,
    /SEAT\s*(\d{1,3}[A-Z])/,
    // Sometimes just the seat number appears
    /\b(\d{1,2}[A-F])\b/
  ];
  
  for (const pattern of seatPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      seatNumber = match[1];
      break;
    }
  }

  // Boarding group/zone
  let boardingGroup = '';
  const boardingPatterns = [
    /(?:GROUP|ZONE|BOARDING)\s*:?\s*([A-Z0-9]+)/,
    /BOARD\s*:?\s*([A-Z0-9]+)/
  ];
  
  for (const pattern of boardingPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      boardingGroup = match[1];
      break;
    }
  }

  console.log('Extracted data:', {
    airline,
    flightNumber,
    confirmationCode,
    origin: originCode,
    destination: destCode,
    seat: seatNumber
  });

  return {
    airline,
    flightNumber: flightNumber || 'UNKNOWN',
    confirmationCode: confirmationCode || 'UNKNOWN',
    origin: {
      airportCode: originCode,
      ...(fallbackAirportData[originCode] || { city: originCode, country: 'USA' })
    },
    destination: {
      airportCode: destCode,
      ...(fallbackAirportData[destCode] || { city: destCode, country: 'USA' })
    },
    scheduledDepartureTime: dateMatches.length > 0 ? parseDateFromMatch(dateMatches[0]) : strictDateExtraction(),
    scheduledArrivalTime: dateMatches.length > 1 ? parseDateFromMatch(dateMatches[1]) : strictDateExtraction(),
    seatNumber,
    boardingGroup
  };
}

function detectAirline(text: string): string | null {
  const airlines = [
    { patterns: [/DELTA AIR LINES/, /DELTA/, /\bDL\b/], name: 'Delta' },
    { patterns: [/AMERICAN AIRLINES/, /AMERICAN/, /\bAA\b/], name: 'American' },
    { patterns: [/UNITED AIRLINES/, /UNITED/, /\bUA\b/], name: 'United' },
    { patterns: [/SOUTHWEST AIRLINES/, /SOUTHWEST/, /\bWN\b/], name: 'Southwest' },
    { patterns: [/SPIRIT AIRLINES/, /SPIRIT/, /\bNK\b/], name: 'Spirit' },
    { patterns: [/FRONTIER AIRLINES/, /FRONTIER/, /\bF9\b/], name: 'Frontier' },
    { patterns: [/JETBLUE AIRWAYS/, /JETBLUE/, /JET BLUE/, /\bB6\b/], name: 'JetBlue' },
    { patterns: [/ALASKA AIRLINES/, /ALASKA/, /\bAS\b/], name: 'Alaska' },
    { patterns: [/HAWAIIAN AIRLINES/, /HAWAIIAN/, /\bHA\b/], name: 'Hawaiian' },
    { patterns: [/NATIONAL AIRLINES/, /NATIONAL/, /\bN7\b/], name: 'National' }
  ];

  for (const airline of airlines) {
    for (const pattern of airline.patterns) {
      if (pattern.test(text)) {
        return airline.name;
      }
    }
  }

  // If no airline found, look for airline codes in flight numbers
  const flightCodeMatch = text.match(/\b([A-Z]{2})\d{1,4}\b/);
  if (flightCodeMatch) {
    const code = flightCodeMatch[1];
    const codeMap: Record<string, string> = {
      'DL': 'Delta',
      'AA': 'American',
      'UA': 'United',
      'WN': 'Southwest',
      'NK': 'Spirit',
      'F9': 'Frontier',
      'B6': 'JetBlue',
      'AS': 'Alaska',
      'HA': 'Hawaiian',
      'N7': 'National'
    };
    return codeMap[code] || null;
  }

  return null;
}

function parseDateFromMatch(match: RegExpMatchArray): Date {
  const monthMap: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };

  try {
    // Try to parse different date formats
    const fullMatch = match[0];
    
    // Format: 15 JAN 2025 10:30 AM
    if (fullMatch.match(/\d{1,2}\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/)) {
      const day = parseInt(match[1]);
      const monthStr = match[2] || 'JAN';
      const month = monthMap[monthStr];
      const year = match[3] ? parseInt(match[3]) : strictDateExtraction().getFullYear();
      
      // Handle 2-digit years
      if (year < 100) {
        const currentYear = strictDateExtraction().getFullYear();
        const century = Math.floor(currentYear / 100) * 100;
        const adjustedYear = century + year;
        // If the date is more than 10 years in the future, assume previous century
        if (adjustedYear > currentYear + 10) {
          return new Date(adjustedYear - 100, month, day);
        }
        return new Date(adjustedYear, month, day);
      }
      
      // Parse time if available
      const timeStr = match[4] || match[0].substring(match[0].indexOf(monthStr) + monthStr.length);
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|A|P)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3];

        if ((period === 'PM' || period === 'P') && hours !== 12) hours += 12;
        if ((period === 'AM' || period === 'A') && hours === 12) hours = 0;

        return new Date(year, month, day, hours, minutes);
      }
      
      return new Date(year, month, day);
    }
    
    // Format: MM/DD/YYYY or MM-DD-YYYY
    if (fullMatch.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)) {
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      let year = parseInt(match[3]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += 2000;
      }
      
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }

  return strictDateExtraction();
}

function getAirlineCode(airline: string): string {
  const codeMap: Record<string, string> = {
    'Delta': 'DL',
    'American': 'AA',
    'United': 'UA',
    'Southwest': 'WN',
    'Spirit': 'NK',
    'Frontier': 'F9',
    'JetBlue': 'B6',
    'Alaska': 'AS',
    'Hawaiian': 'HA',
    'National': 'N7'
  };
  return codeMap[airline] || airline.substring(0, 2).toUpperCase();
}