import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
const pdfParse = require('pdf-parse');
import { createWorker } from 'tesseract.js';

// TypeScript Interfaces for Boarding Pass
export interface BoardingPass {
  scanMetadata: ScanMetadata;
  passenger: Passenger;
  flight: Flight;
  boardingInfo: BoardingInfo;
  rawData?: RawData;
}

export interface ScanMetadata {
  scanId: string;
  scanTimestamp: string;
  sourceFormat: 'BCBP_PDF417' | 'BCBP_QR' | 'OCR' | 'MANUAL';
  confidence?: {
    overall: number;
    fields?: { [key: string]: number };
  };
}

export interface Passenger {
  name: {
    raw: string;
    firstName: string;
    lastName: string;
  };
  pnrCode?: string;
  frequentFlyerNumber?: string;
  ticketNumber?: string;
}

export interface Flight {
  airline: {
    name?: string;
    iataCode: string;
    icaoCode?: string;
  };
  flightNumber: string;
  departure: AirportInfo;
  arrival: AirportInfo;
}

export interface AirportInfo {
  airport?: string;
  city?: string;
  airportCode: string;
  scheduledTime: string;
  gate?: string;
  terminal?: string;
}

export interface BoardingInfo {
  seatNumber: string;
  boardingGroup?: string;
  gate: string;
  boardingTime?: string;
  sequenceNumber?: number;
  classOfService?: string;
}

export interface RawData {
  barcode?: string;
  ocrText?: string;
}

// Advanced Regex Patterns
const PATTERNS = {
  // Flight patterns
  FLIGHT_NUMBER: /\b([A-Z]{2}|[A-Z0-9]{2})\s?(\d{1,4})\b/g,
  
  // Passenger patterns
  PASSENGER_NAME: /([A-Z]+)\/([A-Z]+)/,
  
  // Seat patterns
  SEAT_NUMBER: /(?:SEAT|ST)?\s*(\d{1,3})([A-K])\b/gi,
  
  // PNR/Confirmation
  PNR_CODE: /(?:CONF|PNR|REF|BOOKING)?\s*:?\s*\b([A-Z0-9]{5,7})\b/gi,
  
  // Gate patterns - COMPREHENSIVE
  GATE: /(?:GATE|GT|G)\s*[:#]?\s*([A-Z]?\d{1,3}[A-Z]?)\b/gi,
  DEPARTURE_GATE: /(?:DEP(?:ARTURE)?\s*GATE|FROM\s*GATE)\s*[:#]?\s*([A-Z]?\d{1,3}[A-Z]?)\b/gi,
  
  // Terminal patterns
  TERMINAL: /(?:TERMINAL|TERM|T)\s*[:#]?\s*([A-Z0-9]{1,2})\b/gi,
  
  // Time patterns
  TIME_12H: /\b(\d{1,2}):(\d{2})\s*(AM|PM|A|P)\b/gi,
  TIME_24H: /\b([01]?\d|2[0-3]):([0-5]\d)\b/g,
  BOARDING_TIME: /(?:BOARDING|BOARDS?|BRD)\s*(?:TIME|AT|BY)?\s*[:#]?\s*(\d{1,2}:\d{2}(?:\s*[AP]M?)?)\b/gi,
  
  // Date patterns
  DATE_SHORT: /\b(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?\b/gi,
  DATE_LONG: /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s*(\d{4})?\b/gi,
  
  // Airport codes
  AIRPORT_CODE: /\b([A-Z]{3})\b/g,
  
  // Ticket number
  TICKET_NUMBER: /(?:TICKET|TKT|E-?TICKET)\s*[:#]?\s*(\d{10,14})\b/gi,
  
  // Boarding group/zone
  BOARDING_GROUP: /(?:GROUP|ZONE|BOARDING\s*GROUP)\s*[:#]?\s*([A-Z0-9]{1,2})\b/gi,
  
  // Class of service
  CLASS_SERVICE: /(?:CLASS|CLS)\s*[:#]?\s*([YFBJMHKLVNQO])\b/gi,
  
  // Common table format in boarding passes
  TABLE_ROW: /([A-Z]{2}\d{1,4})\s+(\d{1,2}\s*[A-Z]{3}\s*\d{2,4})\s+(\d{1,2}:\d{2})/g,
  GATE_TIME_SEAT: /(?:GATE\s*)?([A-Z]?\d{1,3}[A-Z]?)\s+(?:BOARDING\s*(?:TILL|TIME)?\s*:?\s*)?(\d{1,2}:\d{2})\s+(?:SEAT\s*)?(\d{1,3}[A-Z])/gi
};

// Airline mappings
const AIRLINE_MAP: Record<string, { name: string; icao?: string }> = {
  'DL': { name: 'Delta', icao: 'DAL' },
  'AA': { name: 'American', icao: 'AAL' },
  'UA': { name: 'United', icao: 'UAL' },
  'WN': { name: 'Southwest', icao: 'SWA' },
  'NK': { name: 'Spirit', icao: 'NKS' },
  'F9': { name: 'Frontier', icao: 'FFT' },
  'B6': { name: 'JetBlue', icao: 'JBU' },
  'AS': { name: 'Alaska', icao: 'ASA' },
  'HA': { name: 'Hawaiian', icao: 'HAL' }
};

// Airport database (subset)
const AIRPORTS: Record<string, { city: string; airport: string; country: string }> = {
  'ORD': { city: 'Chicago', airport: "O'Hare International Airport", country: 'USA' },
  'JFK': { city: 'New York', airport: 'John F. Kennedy International Airport', country: 'USA' },
  'LAX': { city: 'Los Angeles', airport: 'Los Angeles International Airport', country: 'USA' },
  'DFW': { city: 'Dallas', airport: 'Dallas/Fort Worth International Airport', country: 'USA' },
  'ATL': { city: 'Atlanta', airport: 'Hartsfield-Jackson Atlanta International Airport', country: 'USA' },
  'SFO': { city: 'San Francisco', airport: 'San Francisco International Airport', country: 'USA' },
  'MIA': { city: 'Miami', airport: 'Miami International Airport', country: 'USA' },
  'SEA': { city: 'Seattle', airport: 'Seattle-Tacoma International Airport', country: 'USA' },
  'BOS': { city: 'Boston', airport: 'Logan International Airport', country: 'USA' },
  'LAS': { city: 'Las Vegas', airport: 'Harry Reid International Airport', country: 'USA' },
  'DEN': { city: 'Denver', airport: 'Denver International Airport', country: 'USA' },
  'PHX': { city: 'Phoenix', airport: 'Phoenix Sky Harbor International Airport', country: 'USA' },
  'EWR': { city: 'Newark', airport: 'Newark Liberty International Airport', country: 'USA' },
  'IAH': { city: 'Houston', airport: 'George Bush Intercontinental Airport', country: 'USA' },
  'MCO': { city: 'Orlando', airport: 'Orlando International Airport', country: 'USA' }
};

// Generate unique scan ID
function generateScanId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `scan-${timestamp}-${random}`;
}

// Extract text from buffer
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'text/plain') {
      // Direct text conversion
      return buffer.toString('utf-8');
    } else if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } else {
      // Use Tesseract for images
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      return data.text;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Extract all matches for a pattern
function extractAllMatches(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

// Parse passenger name
function parsePassengerName(text: string): Passenger['name'] | null {
  const match = text.match(PATTERNS.PASSENGER_NAME);
  if (match) {
    return {
      raw: match[0],
      lastName: match[1],
      firstName: match[2]
    };
  }
  return null;
}

// Parse flight number
function parseFlightNumber(text: string): { airline: string; number: string } | null {
  const matches = [...text.matchAll(PATTERNS.FLIGHT_NUMBER)];
  if (matches.length > 0) {
    const [, airline, number] = matches[0];
    return { airline, number };
  }
  return null;
}

// Parse date
function parseDate(dateStr: string): Date {
  const monthMap: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  
  const match = dateStr.match(/(\d{1,2})\s*([A-Z]{3})\s*(\d{2,4})?/);
  if (match) {
    const day = parseInt(match[1]);
    const month = monthMap[match[2]];
    let year = match[3] ? parseInt(match[3]) : strictDateExtraction().getFullYear();
    
    if (year < 100) {
      year += 2000;
    }
    
    return new Date(year, month, day);
  }
  
  return strictDateExtraction();
}

// Parse time and combine with date
function parseDateTime(date: Date, timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*([AP]M?))?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3];
    
    if (period) {
      if (period.toUpperCase().startsWith('P') && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase().startsWith('A') && hours === 12) {
        hours = 0;
      }
    }
    
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  }
  
  return date.toISOString();
}

// Main parser function
export async function parseBoardingPassV2(buffer: Buffer, mimeType: string): Promise<BoardingPass | null> {
  try {
    // Extract text
    const rawText = await extractText(buffer, mimeType);
    const normalizedText = rawText.toUpperCase();
    
    console.log('Parsing boarding pass text:', normalizedText.substring(0, 500));
    
    // Initialize scan metadata
    const scanMetadata: ScanMetadata = {
      scanId: generateScanId(),
      scanTimestamp: strictDateExtraction().toISOString(),
      sourceFormat: 'OCR',
      confidence: {
        overall: 0.85,
        fields: {}
      }
    };
    
    // Parse passenger info
    const passengerName = parsePassengerName(normalizedText);
    if (!passengerName) {
      console.log('Could not parse passenger name');
      return null;
    }
    
    const pnrMatches = extractAllMatches(normalizedText, PATTERNS.PNR_CODE);
    const ticketMatches = extractAllMatches(normalizedText, PATTERNS.TICKET_NUMBER);
    
    const passenger: Passenger = {
      name: passengerName,
      pnrCode: pnrMatches[0],
      ticketNumber: ticketMatches[0]
    };
    
    // Parse flight info
    const flightInfo = parseFlightNumber(normalizedText);
    if (!flightInfo) {
      console.log('Could not parse flight number');
      return null;
    }
    
    const airlineInfo = AIRLINE_MAP[flightInfo.airline];
    const flight: Flight = {
      airline: {
        iataCode: flightInfo.airline,
        name: airlineInfo?.name || 'Other',
        icaoCode: airlineInfo?.icao
      },
      flightNumber: `${flightInfo.airline}${flightInfo.number}`,
      departure: {} as AirportInfo,
      arrival: {} as AirportInfo
    };
    
    // Parse airports
    const airportCodes = extractAllMatches(normalizedText, PATTERNS.AIRPORT_CODE);
    const uniqueAirports = [...new Set(airportCodes)].filter(code => AIRPORTS[code]);
    
    if (uniqueAirports.length >= 2) {
      const depCode = uniqueAirports[0];
      const arrCode = uniqueAirports[1];
      
      flight.departure = {
        airportCode: depCode,
        city: AIRPORTS[depCode]?.city,
        airport: AIRPORTS[depCode]?.airport,
        scheduledTime: strictDateExtraction().toISOString() // Will be updated below
      };
      
      flight.arrival = {
        airportCode: arrCode,
        city: AIRPORTS[arrCode]?.city,
        airport: AIRPORTS[arrCode]?.airport,
        scheduledTime: strictDateExtraction().toISOString() // Will be updated below
      };
    } else {
      console.log('Could not find valid airports');
      return null;
    }
    
    // Parse dates and times
    const dateMatches = extractAllMatches(normalizedText, PATTERNS.DATE_SHORT);
    const timeMatches = [...normalizedText.matchAll(PATTERNS.TIME_12H), ...normalizedText.matchAll(PATTERNS.TIME_24H)];
    
    if (dateMatches.length > 0 && timeMatches.length > 0) {
      const flightDate = parseDate(dateMatches[0]);
      const depTime = timeMatches[0][0];
      flight.departure.scheduledTime = parseDateTime(flightDate, depTime);
      
      if (timeMatches.length > 1) {
        flight.arrival.scheduledTime = parseDateTime(flightDate, timeMatches[1][0]);
      }
    }
    
    // Parse gate - CRITICAL PART
    const gateMatches = extractAllMatches(normalizedText, PATTERNS.GATE);
    const depGateMatches = extractAllMatches(normalizedText, PATTERNS.DEPARTURE_GATE);
    const gateTimeSeatMatch = normalizedText.match(PATTERNS.GATE_TIME_SEAT);
    
    let gate = '';
    if (depGateMatches.length > 0) {
      gate = depGateMatches[0];
    } else if (gateMatches.length > 0) {
      gate = gateMatches[0];
    } else if (gateTimeSeatMatch) {
      gate = gateTimeSeatMatch[1];
    }
    
    console.log('GATE EXTRACTION:', {
      gateMatches,
      depGateMatches,
      gateTimeSeatMatch: gateTimeSeatMatch ? gateTimeSeatMatch[1] : null,
      finalGate: gate
    });
    
    // Parse terminals
    const terminalMatches = extractAllMatches(normalizedText, PATTERNS.TERMINAL);
    if (terminalMatches.length > 0) {
      flight.departure.terminal = terminalMatches[0];
      if (terminalMatches.length > 1) {
        flight.arrival.terminal = terminalMatches[1];
      }
    }
    
    // Set gate on departure
    if (gate) {
      flight.departure.gate = gate;
    }
    
    // Parse boarding info
    const seatMatches = [...normalizedText.matchAll(PATTERNS.SEAT_NUMBER)];
    const boardingGroupMatches = extractAllMatches(normalizedText, PATTERNS.BOARDING_GROUP);
    const boardingTimeMatches = extractAllMatches(normalizedText, PATTERNS.BOARDING_TIME);
    const classMatches = extractAllMatches(normalizedText, PATTERNS.CLASS_SERVICE);
    
    const boardingInfo: BoardingInfo = {
      seatNumber: seatMatches.length > 0 ? `${seatMatches[0][1]}${seatMatches[0][2]}` : 'Unknown',
      gate: gate || 'Unknown',
      boardingGroup: boardingGroupMatches[0],
      boardingTime: boardingTimeMatches.length > 0 ? parseDateTime(parseDate(dateMatches[0]), boardingTimeMatches[0]) : undefined,
      classOfService: classMatches[0]
    };
    
    // Construct final boarding pass object
    const boardingPass: BoardingPass = {
      scanMetadata,
      passenger,
      flight,
      boardingInfo,
      rawData: {
        ocrText: rawText.substring(0, 1000) // Limit raw text size
      }
    };
    
    console.log('Successfully parsed boarding pass:', JSON.stringify(boardingPass, null, 2));
    return boardingPass;
    
  } catch (error) {
    console.error('Error parsing boarding pass:', error);
    return null;
  }
}

// Convert to legacy format for compatibility
export function convertToLegacyFormat(boardingPass: BoardingPass): any {
  return {
    airline: boardingPass.flight.airline.name || 'Other',
    flightNumber: boardingPass.flight.flightNumber,
    confirmationCode: boardingPass.passenger.pnrCode || 'UNKNOWN',
    origin: {
      airportCode: boardingPass.flight.departure.airportCode,
      city: boardingPass.flight.departure.city,
      country: 'USA',
      gate: boardingPass.flight.departure.gate
    },
    destination: {
      airportCode: boardingPass.flight.arrival.airportCode,
      city: boardingPass.flight.arrival.city,
      country: 'USA'
    },
    scheduledDepartureTime: new Date(boardingPass.flight.departure.scheduledTime),
    scheduledArrivalTime: new Date(boardingPass.flight.arrival.scheduledTime),
    seatNumber: boardingPass.boardingInfo.seatNumber,
    boardingGroup: boardingPass.boardingInfo.boardingGroup
  };
}