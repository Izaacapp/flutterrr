import { strictDateExtraction } from "./dateStrict";
// Comprehensive aviation lexical analyzer with airport database
export class AviationLexer {
  // Complete IATA airport codes with city names
  private static readonly AIRPORTS: Record<string, { city: string; state?: string; country: string }> = {
    // Major US Hubs
    'ATL': { city: 'Atlanta', state: 'GA', country: 'USA' },
    'DFW': { city: 'Dallas', state: 'TX', country: 'USA' },
    'DEN': { city: 'Denver', state: 'CO', country: 'USA' },
    'ORD': { city: 'Chicago', state: 'IL', country: 'USA' },
    'LAX': { city: 'Los Angeles', state: 'CA', country: 'USA' },
    'JFK': { city: 'New York', state: 'NY', country: 'USA' },
    'LGA': { city: 'New York', state: 'NY', country: 'USA' },
    'EWR': { city: 'Newark', state: 'NJ', country: 'USA' },
    'SFO': { city: 'San Francisco', state: 'CA', country: 'USA' },
    'LAS': { city: 'Las Vegas', state: 'NV', country: 'USA' },
    'SEA': { city: 'Seattle', state: 'WA', country: 'USA' },
    'MCO': { city: 'Orlando', state: 'FL', country: 'USA' },
    'MIA': { city: 'Miami', state: 'FL', country: 'USA' },
    'CLT': { city: 'Charlotte', state: 'NC', country: 'USA' },
    'PHX': { city: 'Phoenix', state: 'AZ', country: 'USA' },
    'IAH': { city: 'Houston', state: 'TX', country: 'USA' },
    'BOS': { city: 'Boston', state: 'MA', country: 'USA' },
    'MSP': { city: 'Minneapolis', state: 'MN', country: 'USA' },
    'DTW': { city: 'Detroit', state: 'MI', country: 'USA' },
    'FLL': { city: 'Fort Lauderdale', state: 'FL', country: 'USA' },
    'PHL': { city: 'Philadelphia', state: 'PA', country: 'USA' },
    'SLC': { city: 'Salt Lake City', state: 'UT', country: 'USA' },
    'DCA': { city: 'Washington', state: 'DC', country: 'USA' },
    'IAD': { city: 'Washington', state: 'VA', country: 'USA' },
    'BWI': { city: 'Baltimore', state: 'MD', country: 'USA' },
    'SAN': { city: 'San Diego', state: 'CA', country: 'USA' },
    'TPA': { city: 'Tampa', state: 'FL', country: 'USA' },
    'AUS': { city: 'Austin', state: 'TX', country: 'USA' },
    'MDW': { city: 'Chicago', state: 'IL', country: 'USA' },
    'DAL': { city: 'Dallas', state: 'TX', country: 'USA' },
    'HOU': { city: 'Houston', state: 'TX', country: 'USA' },
    'OAK': { city: 'Oakland', state: 'CA', country: 'USA' },
    'SJC': { city: 'San Jose', state: 'CA', country: 'USA' },
    'SMF': { city: 'Sacramento', state: 'CA', country: 'USA' },
    'MSY': { city: 'New Orleans', state: 'LA', country: 'USA' },
    'RDU': { city: 'Raleigh', state: 'NC', country: 'USA' },
    'STL': { city: 'St. Louis', state: 'MO', country: 'USA' },
    'BNA': { city: 'Nashville', state: 'TN', country: 'USA' },
    'MCI': { city: 'Kansas City', state: 'MO', country: 'USA' },
    'PDX': { city: 'Portland', state: 'OR', country: 'USA' },
    'CLE': { city: 'Cleveland', state: 'OH', country: 'USA' },
    'IND': { city: 'Indianapolis', state: 'IN', country: 'USA' },
    'PIT': { city: 'Pittsburgh', state: 'PA', country: 'USA' },
    'CVG': { city: 'Cincinnati', state: 'OH', country: 'USA' },
    'CMH': { city: 'Columbus', state: 'OH', country: 'USA' },
    'SAT': { city: 'San Antonio', state: 'TX', country: 'USA' },
    'RSW': { city: 'Fort Myers', state: 'FL', country: 'USA' },
    'PBI': { city: 'West Palm Beach', state: 'FL', country: 'USA' },
    'JAX': { city: 'Jacksonville', state: 'FL', country: 'USA' },
    'MKE': { city: 'Milwaukee', state: 'WI', country: 'USA' },
    'OMA': { city: 'Omaha', state: 'NE', country: 'USA' },
    'RIC': { city: 'Richmond', state: 'VA', country: 'USA' },
    'BDL': { city: 'Hartford', state: 'CT', country: 'USA' },
    'BUF': { city: 'Buffalo', state: 'NY', country: 'USA' },
    'ABQ': { city: 'Albuquerque', state: 'NM', country: 'USA' },
    'ONT': { city: 'Ontario', state: 'CA', country: 'USA' },
    'BUR': { city: 'Burbank', state: 'CA', country: 'USA' },
    'SNA': { city: 'Santa Ana', state: 'CA', country: 'USA' },
    'LGB': { city: 'Long Beach', state: 'CA', country: 'USA' },
    'ANC': { city: 'Anchorage', state: 'AK', country: 'USA' },
    'HNL': { city: 'Honolulu', state: 'HI', country: 'USA' },
    'OGG': { city: 'Maui', state: 'HI', country: 'USA' },
    'KOA': { city: 'Kona', state: 'HI', country: 'USA' },
    'LIH': { city: 'Kauai', state: 'HI', country: 'USA' }
  };

  // Airline codes and names
  private static readonly AIRLINES: Record<string, { name: string; code: string }> = {
    'AA': { name: 'American', code: 'AA' },
    'DL': { name: 'Delta', code: 'DL' },
    'UA': { name: 'United', code: 'UA' },
    'WN': { name: 'Southwest', code: 'WN' },
    'B6': { name: 'JetBlue', code: 'B6' },
    'AS': { name: 'Alaska', code: 'AS' },
    'NK': { name: 'Spirit', code: 'NK' },
    'F9': { name: 'Frontier', code: 'F9' },
    'G4': { name: 'Allegiant', code: 'G4' },
    'HA': { name: 'Hawaiian', code: 'HA' },
    'SY': { name: 'Sun Country', code: 'SY' }
  };

  // Token types for lexical analysis - SIMPLE AND EFFECTIVE
  private static readonly TOKEN_PATTERNS = {
    // Core aviation patterns
    AIRPORT_CODE: /\b([A-Z]{3})\b/g,
    FLIGHT_NUMBER: /\b([A-Z]{2}|[A-Z]\d|\d[A-Z])\s*(\d{1,4}[A-Z]?)\b/g,
    TIME: /\b(\d{1,2}):(\d{2})(?:\s*(AM|PM|A|P))?\b/g,
    DATE: /\b(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?\b/g,
    GATE: /(?:GATE|GT|G)\s*[:#]?\s*([A-Z]?\d{1,3}[A-Z]?)\b/gi,
    SEAT: /\b(\d{1,3}[A-FHJK])\b/g,
    TERMINAL: /\b(?:TERMINAL|TERM)\s*([A-Z0-9]{1,2})\b/gi,
    CONFIRMATION: /\b([A-Z0-9]{5,7})\b/g,
    
    // Common boarding pass table format: "NA4321  06 DEC 20  11:40"
    FLIGHT_DATE_TIME: /\b([A-Z]{2}\d{1,4})\s+(\d{1,2}\s*[A-Z]{3}\s*\d{2,4})\s+(\d{1,2}:\d{2})/g,
    
    // Gate/Boarding/Seat row: "03  11:20  09A" or "Gate 03  Boarding till: 11:20  Seat 09A"
    GATE_BOARDING_SEAT: /(?:GATE\s*)?(\d{1,3})\s+(?:BOARDING\s*(?:TILL|TIME)?\s*:?\s*)?(\d{1,2}:\d{2})\s+(?:SEAT\s*)?(\d{1,3}[A-Z])/gi,
    
    // Specific time contexts
    DEPARTURE_TIME: /(?:DEPART(?:URE)?|TIME)\s*:?\s*(\d{1,2}:\d{2})/gi,
    BOARDING_TIME: /BOARDING\s*(?:TILL|TIME|BY)?\s*:?\s*(\d{1,2}:\d{2})/gi,
    ARRIVAL_TIME: /ARRIV(?:AL|E)\s*(?:TIME)?\s*:?\s*(\d{1,2}:\d{2})/gi
  };

  // Analyze text and extract aviation tokens
  static analyze(text: string): TokenizedData {
    const normalizedText = text.toUpperCase();
    const tokens: Token[] = [];
    const context: ContextData = {};

    // FIRST: Try to find the common table format (Flight Date Time)
    const flightDateTimeMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.FLIGHT_DATE_TIME)];
    if (flightDateTimeMatches.length > 0) {
      const match = flightDateTimeMatches[0];
      // Extract flight number
      tokens.push({
        type: 'FLIGHT',
        value: match[1],
        position: match.index!,
        metadata: { airline: this.AIRLINES[match[1].substring(0,2)]?.name || 'Other', code: match[1].substring(0,2) }
      });
      // Extract date
      tokens.push({
        type: 'DATE',
        value: match[2],
        position: match.index! + match[1].length,
        metadata: this.parseDate(match[2])
      });
      // Extract time
      tokens.push({
        type: 'TIME',
        value: match[3],
        position: match.index! + match[1].length + match[2].length,
        metadata: this.parseTime(match[3])
      });
    }

    // SECOND: Try to find gate/boarding/seat pattern
    const gateBoardingSeatMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.GATE_BOARDING_SEAT)];
    if (gateBoardingSeatMatches.length > 0) {
      const match = gateBoardingSeatMatches[0];
      tokens.push({
        type: 'GATE',
        value: match[1],
        position: match.index!
      });
      tokens.push({
        type: 'TIME',
        value: match[2],
        position: match.index! + match[1].length,
        metadata: { ...this.parseTime(match[2]), context: 'boarding' }
      });
      tokens.push({
        type: 'SEAT',
        value: match[3],
        position: match.index! + match[1].length + match[2].length
      });
    }

    // Find all airport codes
    const airportMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.AIRPORT_CODE)];
    airportMatches.forEach((match, index) => {
      const code = match[1];
      if (this.AIRPORTS[code]) {
        tokens.push({
          type: 'AIRPORT',
          value: code,
          position: match.index!,
          metadata: this.AIRPORTS[code]
        });
      }
    });

    // Determine origin/destination by looking for FROM:/TO: or by position
    const fromIndex = normalizedText.indexOf('FROM:');
    const toIndex = normalizedText.indexOf('TO:');
    
    const airports = tokens.filter(t => t.type === 'AIRPORT').sort((a, b) => a.position - b.position);
    
    if (fromIndex > -1 && toIndex > -1) {
      // Find airports after FROM and TO
      const fromAirport = airports.find(a => a.position > fromIndex && a.position < toIndex);
      const toAirport = airports.find(a => a.position > toIndex);
      
      if (fromAirport) context.origin = fromAirport;
      if (toAirport) context.destination = toAirport;
    } else if (airports.length >= 2) {
      // First airport is origin, second is destination
      context.origin = airports[0];
      context.destination = airports[1];
    }

    // Extract flight numbers
    const flightMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.FLIGHT_NUMBER)];
    flightMatches.forEach(match => {
      const airline = match[1];
      const number = match[2];
      const fullFlight = airline + number;
      
      tokens.push({
        type: 'FLIGHT',
        value: fullFlight,
        position: match.index!,
        metadata: { airline: this.AIRLINES[airline]?.name || 'Other', code: airline }
      });
    });

    // Extract times
    const timeMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.TIME)];
    timeMatches.forEach(match => {
      tokens.push({
        type: 'TIME',
        value: match[0],
        position: match.index!,
        metadata: { hours: match[1], minutes: match[2], period: match[3] }
      });
    });

    // Extract dates
    const dateMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.DATE)];
    dateMatches.forEach(match => {
      tokens.push({
        type: 'DATE',
        value: match[0],
        position: match.index!,
        metadata: { day: match[1], month: match[2], year: match[3] }
      });
    });

    // Extract gates
    const gateMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.GATE)];
    gateMatches.forEach(match => {
      tokens.push({
        type: 'GATE',
        value: match[1],
        position: match.index!
      });
    });

    // Extract seats
    const seatMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.SEAT)];
    seatMatches.forEach(match => {
      // Verify it's a valid seat pattern and not part of a flight number
      const beforeChar = normalizedText[match.index! - 1];
      const afterChar = normalizedText[match.index! + match[0].length];
      if ((!beforeChar || /\s/.test(beforeChar)) && (!afterChar || /\s/.test(afterChar))) {
        tokens.push({
          type: 'SEAT',
          value: match[1],
          position: match.index!
        });
      }
    });

    // Extract terminals
    const terminalMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.TERMINAL)];
    terminalMatches.forEach(match => {
      tokens.push({
        type: 'TERMINAL',
        value: match[1],
        position: match.index!
      });
    });

    // Extract confirmation codes (6-7 character alphanumeric)
    const confirmationMatches = [...normalizedText.matchAll(this.TOKEN_PATTERNS.CONFIRMATION)];
    confirmationMatches.forEach(match => {
      const value = match[1];
      // Filter out common false positives
      if (!this.AIRPORTS[value] && !this.AIRLINES[value.substring(0, 2)] && 
          /[0-9]/.test(value) && /[A-Z]/.test(value)) {
        tokens.push({
          type: 'CONFIRMATION',
          value: value,
          position: match.index!
        });
      }
    });

    // Extract specific time contexts
    const departureTimeMatch = normalizedText.match(this.TOKEN_PATTERNS.DEPARTURE_TIME);
    if (departureTimeMatch) {
      tokens.push({
        type: 'TIME',
        value: departureTimeMatch[1],
        position: departureTimeMatch.index!,
        metadata: { ...this.parseTime(departureTimeMatch[1]), context: 'departure' }
      });
    }

    const boardingTimeMatch = normalizedText.match(this.TOKEN_PATTERNS.BOARDING_TIME);
    if (boardingTimeMatch) {
      tokens.push({
        type: 'TIME',
        value: boardingTimeMatch[1],
        position: boardingTimeMatch.index!,
        metadata: { ...this.parseTime(boardingTimeMatch[1]), context: 'boarding' }
      });
    }

    const arrivalTimeMatch = normalizedText.match(this.TOKEN_PATTERNS.ARRIVAL_TIME);
    if (arrivalTimeMatch) {
      tokens.push({
        type: 'TIME',
        value: arrivalTimeMatch[1],
        position: arrivalTimeMatch.index!,
        metadata: { ...this.parseTime(arrivalTimeMatch[1]), context: 'arrival' }
      });
    }

    // Find boarding time from gate/boarding/seat pattern or specific match
    const boardingTimeToken = tokens.find(t => t.type === 'TIME' && t.metadata?.context === 'boarding');
    if (boardingTimeToken) {
      context.boardingTime = boardingTimeToken;
    }

    return { tokens, context, text: normalizedText };
  }


  // Convert lexical tokens to boarding pass data
  static tokensToPassData(analysis: TokenizedData): any {
    const { tokens, context } = analysis;

    // Find primary flight
    const flightToken = tokens.find(t => t.type === 'FLIGHT');
    
    // Find primary date
    const dateToken = tokens.find(t => t.type === 'DATE');
    
    // Find times by context
    const departureTime = tokens.find(t => t.type === 'TIME' && t.metadata?.context === 'departure') ||
                         tokens.find(t => t.type === 'TIME' && !t.metadata?.context);
    const arrivalTime = tokens.find(t => t.type === 'TIME' && t.metadata?.context === 'arrival');
    const boardingTime = tokens.find(t => t.type === 'TIME' && t.metadata?.context === 'boarding');

    // Find confirmation code
    const confirmationToken = tokens.find(t => t.type === 'CONFIRMATION');

    // Find seat
    const seatToken = tokens.find(t => t.type === 'SEAT');

    // Find gate
    const gateToken = tokens.find(t => t.type === 'GATE');

    return {
      airline: flightToken?.metadata?.airline || 'Other',
      flightNumber: flightToken?.value || 'UNKNOWN',
      confirmationCode: confirmationToken?.value || 'UNKNOWN',
      origin: {
        airportCode: context.origin?.value || 'ORD',
        city: context.origin?.metadata?.city || 'Chicago',
        country: context.origin?.metadata?.country || 'USA',
        gate: gateToken?.value
      },
      destination: {
        airportCode: context.destination?.value || 'JFK',
        city: context.destination?.metadata?.city || 'New York',
        country: context.destination?.metadata?.country || 'USA'
      },
      scheduledDepartureTime: this.buildDateTime(dateToken, departureTime),
      scheduledArrivalTime: this.buildDateTime(dateToken, arrivalTime || departureTime),
      seatNumber: seatToken?.value,
      boardingGroup: gateToken?.value,
      boardingTime: boardingTime ? this.buildDateTime(dateToken, boardingTime) : undefined
    };
  }

  private static parseDate(dateStr: string): any {
    const match = dateStr.match(/(\d{1,2})\s*([A-Z]{3})\s*(\d{2,4})?/);
    if (match) {
      return {
        day: match[1],
        month: match[2],
        year: match[3] || strictDateExtraction().getFullYear().toString()
      };
    }
    return {};
  }

  private static parseTime(timeStr: string): any {
    const match = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|A|P))?/);
    if (match) {
      return {
        hours: match[1],
        minutes: match[2],
        period: match[3]
      };
    }
    return {};
  }

  private static buildDateTime(dateToken?: Token, timeToken?: Token): Date {
    const now = strictDateExtraction();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();
    let hours = 12;
    let minutes = 0;

    if (dateToken?.metadata) {
      day = parseInt(dateToken.metadata.day);
      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
      };
      month = monthMap[dateToken.metadata.month] || 0;
      if (dateToken.metadata.year) {
        year = parseInt(dateToken.metadata.year);
        if (year < 100) year += 2000;
      }
    }

    if (timeToken?.metadata) {
      hours = parseInt(timeToken.metadata.hours);
      minutes = parseInt(timeToken.metadata.minutes);
      const period = timeToken.metadata.period;
      if ((period === 'PM' || period === 'P') && hours !== 12) hours += 12;
      if ((period === 'AM' || period === 'A') && hours === 12) hours = 0;
    }

    return new Date(year, month, day, hours, minutes);
  }
}

// Type definitions
interface Token {
  type: 'AIRPORT' | 'FLIGHT' | 'TIME' | 'DATE' | 'GATE' | 'SEAT' | 'TERMINAL' | 'CONFIRMATION';
  value: string;
  position: number;
  metadata?: any;
}

interface ContextData {
  origin?: Token;
  destination?: Token;
  boardingTime?: Token;
}

interface TokenizedData {
  tokens: Token[];
  context: ContextData;
  text: string;
}

export type { Token, ContextData, TokenizedData };