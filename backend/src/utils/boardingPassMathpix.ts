import { strictDateExtraction } from "./dateStrict";
import { safeStrictDateExtraction } from "./dateStrict";
import axios from 'axios';
import { BoardingPass, Flight, AirportInfo, Passenger, BoardingInfo, ScanMetadata } from './boardingPassParserV2';

const MATHPIX_APP_ID = process.env.MATHPIX_APP_ID || '';
const MATHPIX_APP_KEY = process.env.MATHPIX_APP_KEY || '';

interface MathpixResponse {
  text: string;
  data: Array<{
    type: string;
    value: any;
  }>;
  line_data: Array<{
    text: string;
    bbox: number[];
    words: Array<{
      text: string;
      confidence: number;
    }>;
  }>;
  confidence: number;
  confidence_rate: number;
}

export async function parseBoardingPassWithMathpix(buffer: Buffer, mimeType: string): Promise<BoardingPass | null> {
  try {
    // Convert buffer to base64
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    // Call Mathpix API
    const response = await axios.post('https://api.mathpix.com/v3/text', {
      src: dataUri,
      formats: ['text', 'data', 'lines'],
      data_options: {
        include_asciimath: false,
        include_latex: false,
        include_table_data: true
      },
      ocr: ['en'],
      skip_recombine: false,
      enable_tables_fallback: true
    }, {
      headers: {
        'app_id': MATHPIX_APP_ID,
        'app_key': MATHPIX_APP_KEY,
        'Content-Type': 'application/json'
      }
    });

    const mathpixData: MathpixResponse = response.data;
    console.log('Mathpix OCR Response:', JSON.stringify(mathpixData, null, 2));

    // Parse line by line data
    const parsedData = parseLineData(mathpixData.line_data);
    
    // Build boarding pass object
    return buildBoardingPass(parsedData, mathpixData.confidence_rate);
  } catch (error) {
    console.error('Mathpix OCR Error:', error);
    return null;
  }
}

interface ParsedLineData {
  airline?: string;
  flightNumber?: string;
  passenger?: string;
  pnr?: string;
  departure?: {
    airport: string;
    city?: string;
    date?: string;
    time?: string;
    gate?: string;
    terminal?: string;
  };
  arrival?: {
    airport: string;
    city?: string;
    date?: string;
    time?: string;
    gate?: string;
    terminal?: string;
  };
  seat?: string;
  boardingGroup?: string;
  boardingTime?: string;
}

function parseLineData(lines: MathpixResponse['line_data']): ParsedLineData {
  const result: ParsedLineData = {};
  
  // Process each line as potential JSON structure
  lines.forEach((line, index) => {
    const text = line.text.trim().toUpperCase();
    
    // Flight number patterns
    if (!result.flightNumber) {
      const flightMatch = text.match(/([A-Z]{2})\s*(\d{3,4})/);
      if (flightMatch) {
        result.airline = flightMatch[1];
        result.flightNumber = `${flightMatch[1]}${flightMatch[2]}`;
      }
    }
    
    // Passenger name (usually in format LASTNAME/FIRSTNAME)
    if (!result.passenger) {
      const nameMatch = text.match(/([A-Z]+)\/([A-Z]+)/);
      if (nameMatch) {
        result.passenger = `${nameMatch[2]} ${nameMatch[1]}`;
      }
    }
    
    // PNR/Confirmation
    if (!result.pnr) {
      const pnrMatch = text.match(/(?:CONF|PNR|REF|CONFIRMATION)\s*:?\s*([A-Z0-9]{5,7})/);
      if (pnrMatch) {
        result.pnr = pnrMatch[1];
      }
    }
    
    // Airport codes (3 letter codes)
    const airportMatches = text.match(/\b([A-Z]{3})\b/g);
    if (airportMatches && airportMatches.length >= 2) {
      if (!result.departure) {
        result.departure = { airport: airportMatches[0] };
      }
      if (!result.arrival) {
        result.arrival = { airport: airportMatches[1] };
      }
    }
    
    // Date patterns
    const dateMatch = text.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?/);
    if (dateMatch && result.departure) {
      result.departure.date = dateMatch[0];
    }
    
    // Time patterns with context
    if (text.includes('DEPART') || text.includes('DEP')) {
      const timeMatch = text.match(/(\d{1,2}:\d{2})\s*([AP]M)?/);
      if (timeMatch && result.departure) {
        result.departure.time = timeMatch[0];
      }
    }
    
    if (text.includes('ARRIV') || text.includes('ARR')) {
      const timeMatch = text.match(/(\d{1,2}:\d{2})\s*([AP]M)?/);
      if (timeMatch && result.arrival) {
        result.arrival.time = timeMatch[0];
      }
    }
    
    // Gate
    const gateMatch = text.match(/GATE\s*:?\s*([A-Z]?\d{1,3}[A-Z]?)/);
    if (gateMatch && result.departure) {
      result.departure.gate = gateMatch[1];
    }
    
    // Seat
    const seatMatch = text.match(/SEAT\s*:?\s*(\d{1,3}[A-Z])/);
    if (seatMatch) {
      result.seat = seatMatch[1];
    }
    
    // Look for structured table data
    if (index < lines.length - 1) {
      const nextLine = lines[index + 1].text.trim().toUpperCase();
      
      // Check for flight/date/time patterns in consecutive lines
      if (text.match(/FLIGHT|FLT/) && nextLine.match(/\d/)) {
        const parts = nextLine.split(/\s+/);
        if (parts.length >= 3) {
          result.flightNumber = parts[0];
          // Parse remaining parts for date/time
        }
      }
    }
  });
  
  return result;
}

function buildBoardingPass(data: ParsedLineData, confidence: number): BoardingPass | null {
  if (!data.departure?.airport || !data.arrival?.airport) {
    console.error('Missing required airports');
    return null;
  }
  
  const scanMetadata: ScanMetadata = {
    scanId: `mathpix-${Date.now()}`,
    scanTimestamp: strictDateExtraction().toISOString(),
    sourceFormat: 'OCR',
    confidence: {
      overall: confidence,
      fields: {}
    }
  };
  
  const passenger: Passenger = {
    name: {
      raw: data.passenger || 'UNKNOWN',
      firstName: data.passenger?.split(' ')[0] || 'UNKNOWN',
      lastName: data.passenger?.split(' ')[1] || 'UNKNOWN'
    },
    pnrCode: data.pnr
  };
  
  const flight: Flight = {
    airline: {
      iataCode: data.airline || 'XX',
      name: getAirlineName(data.airline || 'XX')
    },
    flightNumber: data.flightNumber || 'UNKNOWN',
    departure: {
      airportCode: data.departure.airport,
      city: data.departure.city,
      scheduledTime: parseDateTime(data.departure.date, data.departure.time),
      gate: data.departure.gate,
      terminal: data.departure.terminal
    },
    arrival: {
      airportCode: data.arrival.airport,
      city: data.arrival.city,
      scheduledTime: parseDateTime(data.arrival.date || data.departure.date, data.arrival.time),
      gate: data.arrival.gate,
      terminal: data.arrival.terminal
    }
  };
  
  const boardingInfo: BoardingInfo = {
    seatNumber: data.seat || 'UNKNOWN',
    gate: data.departure?.gate || 'UNKNOWN',
    boardingGroup: data.boardingGroup,
    boardingTime: data.boardingTime
  };
  
  return {
    scanMetadata,
    passenger,
    flight,
    boardingInfo
  };
}

function parseDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return strictDateExtraction().toISOString();
  
  const monthMap: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  
  const dateMatch = dateStr.match(/(\d{1,2})\s*([A-Z]{3})\s*(\d{2,4})?/);
  if (!dateMatch) return strictDateExtraction().toISOString();
  
  const day = parseInt(dateMatch[1]);
  const month = monthMap[dateMatch[2]] || 0;
  let year = dateMatch[3] ? parseInt(dateMatch[3]) : strictDateExtraction().getFullYear();
  
  if (year < 100) {
    year += 2000;
  }
  
  const date = new Date(year, month, day);
  
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3];
      
      if (period) {
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
      
      date.setHours(hours, minutes, 0, 0);
    }
  }
  
  return date.toISOString();
}

function getAirlineName(iataCode: string): string {
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
  
  return airlines[iataCode] || 'Other';
}