import { safeStrictDateExtraction } from "./dateStrict";
import { BoardingPassError, BoardingPassErrorCode } from '../errors/BoardingPassError';
import { 
  getAirportTimezone, 
  parseZonedDateTime,
  estimateFlightDuration 
} from '../services/timeHandling.service';

/**
 * Strict date extraction - NO FALLBACKS
 */
export function strictDateExtraction(text: string): Date {
  const normalizedText = text.toUpperCase();
  
  // Try multiple date patterns
  const patterns = [
    // Full month: October 9, 2024
    {
      regex: /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s*(\d{4})/i,
      parser: (match: RegExpMatchArray) => {
        const monthMap: Record<string, number> = {
          'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'MAY': 4, 'JUNE': 5,
          'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
        };
        return new Date(parseInt(match[3]), monthMap[match[1].toUpperCase()], parseInt(match[2]));
      }
    },
    // Abbreviated: 15 MAR 2024
    {
      regex: /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i,
      parser: (match: RegExpMatchArray) => {
        const monthMap: Record<string, number> = {
          'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
          'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };
        return new Date(parseInt(match[3]), monthMap[match[2].toUpperCase()], parseInt(match[1]));
      }
    },
    // ISO format: 2024-03-15
    {
      regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
      parser: (match: RegExpMatchArray) => {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    },
    // US format: 03/15/2024
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      parser: (match: RegExpMatchArray) => {
        return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      }
    }
  ];
  
  for (const { regex, parser } of patterns) {
    const match = normalizedText.match(regex);
    if (match) {
      const date = parser(match);
      return validateDateRange(date);
    }
  }
  
  // NO FALLBACK - throw error with helpful context
  throw new BoardingPassError('DATE_PARSE_FAILED', {
    text: text.substring(0, 200),
    suggestion: 'Please manually enter the flight date in MM/DD/YYYY format',
    requiredFormat: 'MM/DD/YYYY or DD MMM YYYY'
  });
}

/**
 * Validate date is within reasonable range
 */
export function validateDateRange(date: Date): Date {
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1 year ago
  const maxDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years ahead
  
  if (date < minDate || date > maxDate) {
    throw new BoardingPassError('INVALID_DATE_RANGE', {
      value: date.toISOString(),
      suggestion: `Date must be between ${minDate.toLocaleDateString()} and ${maxDate.toLocaleDateString()}`
    });
  }
  
  return date;
}

/**
 * Dynamic arrival time estimation based on route
 */
export function estimateArrivalTime(
  departure: Date,
  origin: string,
  destination: string
): Date {
  const route = `${origin.toUpperCase()}-${destination.toUpperCase()}`;
  
  try {
    const durationHours = estimateFlightDuration(origin, destination);
    return new Date(departure.getTime() + durationHours * 60 * 60 * 1000);
  } catch (error) {
    throw new BoardingPassError('ROUTE_NOT_FOUND', {
      value: route,
      suggestion: 'Please manually enter the arrival time'
    });
  }
}

/**
 * Parse time with timezone awareness
 */
export function parseZonedTime(
  date: Date,
  timeStr: string,
  airportCode: string
): Date {
  const timezone = getAirportTimezone(airportCode);
  
  if (!timezone) {
    throw new BoardingPassError('AIRPORT_NOT_FOUND', {
      value: airportCode,
      field: 'timezone',
      suggestion: `Unknown airport ${airportCode}. Please verify the airport code.`
    });
  }
  
  const zonedDateTime = parseZonedDateTime(date, timeStr, airportCode);
  if (!zonedDateTime) {
    throw new BoardingPassError('TIME_PARSE_FAILED', {
      value: timeStr,
      field: airportCode,
      requiredFormat: 'HH:MM or HH:MM AM/PM'
    });
  }
  
  return zonedDateTime;
}

/**
 * Smart OCR time correction with confidence
 */
export function correctOcrTimeStrict(
  timeStr: string,
  confidence: number
): string {
  // Reject if confidence too low
  if (confidence < 0.5) {
    throw new BoardingPassError('OCR_CONFIDENCE_TOO_LOW', {
      value: timeStr,
      confidence,
      suggestion: 'Image quality too low. Please retake photo or enter manually.'
    });
  }
  
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    throw new BoardingPassError('INVALID_TIME_FORMAT', {
      value: timeStr,
      requiredFormat: 'HH:MM'
    });
  }
  
  let hours = parseInt(timeMatch[1]);
  let minutes = parseInt(timeMatch[2]);
  
  // Only correct if confidence is low-medium
  if (confidence < 0.7) {
    // Common OCR errors
    if (minutes === 80) minutes = 30;
    else if (minutes === 70) minutes = 10;
    else if (minutes >= 60) minutes = minutes % 60;
    
    if (hours >= 24) hours = hours % 24;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Structured time parse result
 */
export interface TimeParseResult {
  success: boolean;
  time?: Date;
  timezone?: string;
  confidence?: number;
  error?: {
    code: BoardingPassErrorCode;
    message: string;
    suggestion: string;
  };
}

/**
 * Safe time parsing with structured error recovery
 */
export function safeParseTime(
  text: string,
  airportCode: string,
  timeType: 'departure' | 'arrival' | 'boarding' = 'departure'
): TimeParseResult {
  try {
    // Extract date first
    const date = strictDateExtraction(text);
    
    // Find time pattern based on context
    const timePatterns: Record<string, RegExp[]> = {
      departure: [
        /DEPART(?:URE)?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
        /DEP\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
        /LEAVES?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i
      ],
      arrival: [
        /ARRIV(?:AL)?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
        /ARR\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
        /LANDS?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i
      ],
      boarding: [
        /BOARDING\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i,
        /BOARDS?\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i
      ]
    };
    
    let timeStr: string | null = null;
    const patterns = timePatterns[timeType] || timePatterns.departure;
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        timeStr = match[1];
        break;
      }
    }
    
    if (!timeStr) {
      throw new BoardingPassError('TIME_PARSE_FAILED', {
        field: timeType,
        text: text.substring(0, 100)
      });
    }
    
    // Parse with timezone
    const zonedTime = parseZonedTime(date, timeStr, airportCode);
    const timezone = getAirportTimezone(airportCode);
    
    return {
      success: true,
      time: zonedTime,
      timezone: timezone || undefined,
      confidence: 0.9
    };
    
  } catch (error) {
    if (error instanceof BoardingPassError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          suggestion: error.context.suggestion || 'Please enter manually'
        }
      };
    }
    
    // Unknown error
    return {
      success: false,
      error: {
        code: 'TIME_PARSE_FAILED',
        message: 'Unexpected error parsing time',
        suggestion: 'Please try again or enter manually'
      }
    };
  }
}

/**
 * Get airline-specific time parsing order
 */
export function getAirlineTimeOrder(airlineCode: string): string[] {
  const AIRLINE_TIME_ORDER: Record<string, string[]> = {
    // Standard order (most airlines)
    'default': ['boarding', 'departure', 'arrival'],
    // Ryanair lists arrival first
    'FR': ['arrival', 'departure', 'boarding'],
    // EasyJet similar to Ryanair
    'U2': ['arrival', 'departure', 'boarding'],
    // Some Asian carriers
    'SQ': ['departure', 'arrival', 'boarding'],
    'CX': ['departure', 'arrival', 'boarding']
  };
  
  return AIRLINE_TIME_ORDER[airlineCode] || AIRLINE_TIME_ORDER.default;
}