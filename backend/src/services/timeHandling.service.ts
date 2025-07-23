import { strictDateExtraction } from "../utils/dateStrict";
const airportLookup = require('airport-lookup');
const tzlookup = require('tz-lookup');

interface FlightTimeData {
  departure?: Date;
  arrival?: Date;
  boarding?: Date;
  confidence: number;
  timezone?: string;
  errors?: string[];
}

interface TimeExtractionResult {
  time: string;
  confidence: number;
  type?: 'departure' | 'arrival' | 'boarding';
}

// Route-based flight duration estimates (in hours)
const FLIGHT_DURATIONS: Record<string, number> = {
  // Domestic US
  'LAX-JFK': 5.5, 'JFK-LAX': 6.0, // West-East faster due to jet stream
  'LAX-ORD': 4.0, 'ORD-LAX': 4.5,
  'JFK-MIA': 3.0, 'MIA-JFK': 3.0,
  'SFO-BOS': 5.5, 'BOS-SFO': 6.0,
  'DFW-SEA': 4.0, 'SEA-DFW': 3.5,
  
  // International
  'JFK-LHR': 7.0, 'LHR-JFK': 8.0,
  'LAX-NRT': 11.5, 'NRT-LAX': 10.0,
  'DFW-CDG': 9.5, 'CDG-DFW': 10.5,
  'MIA-GRU': 8.5, 'GRU-MIA': 8.0,
  'ORD-FRA': 8.5, 'FRA-ORD': 9.5,
  
  // European
  'LHR-CDG': 1.25, 'CDG-LHR': 1.25,
  'DUB-BCN': 2.5, 'BCN-DUB': 2.5,
  'FRA-MAD': 2.5, 'MAD-FRA': 2.5,
  'AMS-FCO': 2.25, 'FCO-AMS': 2.25,
  
  // Default estimates by distance
  'SHORT': 1.5,   // < 500 miles
  'MEDIUM': 3.0,  // 500-1500 miles
  'LONG': 6.0,    // 1500-3000 miles
  'ULTRA': 12.0   // > 3000 miles
};

// Airline-specific time ordering patterns
const AIRLINE_TIME_PATTERNS: Record<string, string[]> = {
  'FR': ['arrival', 'departure', 'boarding'], // Ryanair lists arrival first
  'U2': ['arrival', 'departure', 'boarding'], // easyJet similar
  'default': ['boarding', 'departure', 'arrival'] // Standard order
};

/**
 * Get airport timezone from IATA code
 */
export function getAirportTimezone(airportCode: string): string | null {
  const airport = airportLookup(airportCode);
  if (!airport || !airport.latitude || !airport.longitude) {
    return null;
  }
  
  try {
    return tzlookup(airport.latitude, airport.longitude);
  } catch (error) {
    console.error(`Failed to get timezone for ${airportCode}:`, error);
    return null;
  }
}

/**
 * Estimate flight duration between airports
 */
export function estimateFlightDuration(origin: string, destination: string): number {
  // Check exact route
  const routeKey = `${origin.toUpperCase()}-${destination.toUpperCase()}`;
  if (FLIGHT_DURATIONS[routeKey]) {
    return FLIGHT_DURATIONS[routeKey];
  }
  
  // Calculate distance-based estimate
  const originAirport = airportLookup(origin);
  const destAirport = airportLookup(destination);
  
  if (!originAirport || !destAirport) {
    return 2.5; // Default fallback
  }
  
  const distance = calculateDistance(
    originAirport.latitude!,
    originAirport.longitude!,
    destAirport.latitude!,
    destAirport.longitude!
  );
  
  if (distance < 500) return FLIGHT_DURATIONS.SHORT;
  if (distance < 1500) return FLIGHT_DURATIONS.MEDIUM;
  if (distance < 3000) return FLIGHT_DURATIONS.LONG;
  return FLIGHT_DURATIONS.ULTRA;
}

/**
 * Calculate distance between two points (in miles)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Smart arrival time estimation
 */
export function estimateArrivalTime(
  departure: Date, 
  origin: string, 
  destination: string
): Date {
  const flightHours = estimateFlightDuration(origin, destination);
  return new Date(departure.getTime() + flightHours * 60 * 60 * 1000);
}

/**
 * Parse datetime with timezone awareness
 */
export function parseZonedDateTime(
  date: Date, 
  timeStr: string, 
  airportCode: string
): Date | null {
  const timezone = getAirportTimezone(airportCode);
  if (!timezone) {
    console.warn(`No timezone found for ${airportCode}, using local time`);
    return parseLocalDateTime(date, timeStr);
  }
  
  try {
    // Parse the time components
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M?)?/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    // Handle AM/PM
    if (period) {
      if (period.toUpperCase().startsWith('P') && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase().startsWith('A') && hours === 12) {
        hours = 0;
      }
    }
    
    // Create date string in airport timezone
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const timeStrFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    // Create date in specific timezone
    const zonedDate = new Date(`${dateStr}T${timeStrFormatted}`);
    
    // Adjust for timezone offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return new Date(formatter.format(zonedDate));
  } catch (error) {
    console.error('Failed to parse zoned datetime:', error);
    return parseLocalDateTime(date, timeStr);
  }
}

/**
 * Parse local datetime (fallback)
 */
function parseLocalDateTime(date: Date, timeStr: string): Date | null {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M?)?/i);
  if (!timeMatch) return null;
  
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

/**
 * Confidence-based OCR time correction
 */
export function correctOcrTime(timeStr: string, confidence: number): TimeExtractionResult {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return { time: timeStr, confidence: 0 };
  }
  
  let hours = parseInt(timeMatch[1]);
  let minutes = parseInt(timeMatch[2]);
  let corrected = false;
  
  // Only correct low-confidence reads
  if (confidence < 0.7) {
    // Common OCR errors
    if (minutes === 80) {
      minutes = 30;
      corrected = true;
    } else if (minutes === 70) {
      minutes = 10;
      corrected = true;
    } else if (minutes >= 60) {
      minutes = minutes % 60;
      corrected = true;
    }
    
    if (hours >= 24) {
      hours = hours % 24;
      corrected = true;
    }
  }
  
  const correctedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return {
    time: correctedTime,
    confidence: corrected ? confidence * 0.8 : confidence
  };
}

/**
 * Extract times based on airline patterns
 */
export function extractTimesByAirline(
  text: string, 
  airlineCode: string
): Record<string, TimeExtractionResult> {
  const times: TimeExtractionResult[] = [];
  const timeRegex = /(\d{1,2}:\d{2}\s*[AP]M?)/gi;
  const matches = text.match(timeRegex) || [];
  
  // Extract all times with positions
  matches.forEach((match, index) => {
    const position = text.indexOf(match);
    const contextBefore = text.substring(Math.max(0, position - 20), position).toUpperCase();
    
    let type: 'departure' | 'arrival' | 'boarding' | undefined;
    if (contextBefore.includes('BOARD')) type = 'boarding';
    else if (contextBefore.includes('DEPART') || contextBefore.includes('DEP')) type = 'departure';
    else if (contextBefore.includes('ARRIV') || contextBefore.includes('ARR')) type = 'arrival';
    
    times.push({
      time: match,
      confidence: type ? 0.9 : 0.6,
      type
    });
  });
  
  // Apply airline-specific ordering
  const pattern = AIRLINE_TIME_PATTERNS[airlineCode] || AIRLINE_TIME_PATTERNS.default;
  const result: Record<string, TimeExtractionResult> = {};
  
  // First, assign labeled times
  times.forEach(t => {
    if (t.type) {
      result[t.type] = t;
    }
  });
  
  // Then, assign unlabeled times based on pattern
  const unlabeled = times.filter(t => !t.type);
  pattern.forEach((type, index) => {
    if (!result[type] && unlabeled[index]) {
      result[type] = { ...unlabeled[index], type: type as any };
    }
  });
  
  return result;
}

/**
 * Validate date is within reasonable range
 */
export function validateDateRange(date: Date): { valid: boolean; error?: string } {
  const now = strictDateExtraction();
  const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1 year ago
  const maxDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years ahead
  
  if (date < minDate) {
    return { valid: false, error: 'Date is too far in the past' };
  }
  
  if (date > maxDate) {
    return { valid: false, error: 'Date is too far in the future' };
  }
  
  return { valid: true };
}

/**
 * Main time extraction with all improvements
 */
export function extractFlightTimes(
  text: string,
  flightDate: Date | null,
  origin: string,
  destination: string,
  airlineCode?: string
): FlightTimeData {
  const errors: string[] = [];
  const result: FlightTimeData = {
    confidence: 0
  };
  
  // Validate and use flight date
  if (!flightDate) {
    errors.push('No flight date found');
    return { ...result, errors };
  }
  
  const dateValidation = validateDateRange(flightDate);
  if (!dateValidation.valid) {
    errors.push(dateValidation.error!);
    return { ...result, errors };
  }
  
  // Extract times based on airline
  const times = extractTimesByAirline(text, airlineCode || 'default');
  
  // Process departure time
  if (times.departure) {
    const corrected = correctOcrTime(times.departure.time, times.departure.confidence);
    const departure = parseZonedDateTime(flightDate, corrected.time, origin);
    if (departure) {
      result.departure = departure;
      result.timezone = getAirportTimezone(origin) || undefined;
      result.confidence = Math.max(result.confidence, corrected.confidence);
    } else {
      errors.push('Failed to parse departure time');
    }
  } else {
    errors.push('No departure time found');
  }
  
  // Process arrival time
  if (times.arrival) {
    const corrected = correctOcrTime(times.arrival.time, times.arrival.confidence);
    const arrival = parseZonedDateTime(flightDate, corrected.time, destination);
    if (arrival) {
      result.arrival = arrival;
      result.confidence = Math.max(result.confidence, corrected.confidence);
    }
  } else if (result.departure) {
    // Estimate arrival based on route
    result.arrival = estimateArrivalTime(result.departure, origin, destination);
    errors.push('Arrival time estimated based on route');
  }
  
  // Process boarding time
  if (times.boarding) {
    const corrected = correctOcrTime(times.boarding.time, times.boarding.confidence);
    const boarding = parseZonedDateTime(flightDate, corrected.time, origin);
    if (boarding) {
      result.boarding = boarding;
    }
  }
  
  // Final validation
  if (result.departure && result.arrival) {
    if (result.arrival <= result.departure) {
      // Assume next day arrival
      result.arrival = new Date(result.arrival.getTime() + 24 * 60 * 60 * 1000);
      errors.push('Adjusted arrival to next day');
    }
  }
  
  if (errors.length > 0) {
    result.errors = errors;
  }
  
  return result;
}

// Export for testing
export const testHelpers = {
  FLIGHT_DURATIONS,
  AIRLINE_TIME_PATTERNS,
  calculateDistance
};