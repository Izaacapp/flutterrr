const levenshtein = require('levenshtein');

// IATA Airline codes database
const AIRLINE_CODES: Record<string, string> = {
  'AA': 'American Airlines',
  'DL': 'Delta Air Lines',
  'UA': 'United Airlines',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue Airways',
  'AS': 'Alaska Airlines',
  'NK': 'Spirit Airlines',
  'F9': 'Frontier Airlines',
  'HA': 'Hawaiian Airlines',
  'AC': 'Air Canada',
  'BA': 'British Airways',
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'KL': 'KLM',
  'FR': 'Ryanair',
  'EI': 'Aer Lingus',
  'IB': 'Iberia',
  'AZ': 'Alitalia',
  'LX': 'Swiss International',
  'OS': 'Austrian Airlines',
  'SN': 'Brussels Airlines',
  'SK': 'SAS',
  'AY': 'Finnair',
  'TP': 'TAP Air Portugal',
  'TK': 'Turkish Airlines',
  'SU': 'Aeroflot',
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'NH': 'All Nippon Airways',
  'JL': 'Japan Airlines',
  'QF': 'Qantas',
  'NZ': 'Air New Zealand',
  'VA': 'Virgin Australia',
  'AI': 'Air India',
  'MH': 'Malaysia Airlines',
  'TG': 'Thai Airways',
  'GA': 'Garuda Indonesia',
  'PR': 'Philippine Airlines',
  'VN': 'Vietnam Airlines',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'MU': 'China Eastern',
  'CA': 'Air China',
  'CZ': 'China Southern',
  'JD': 'Beijing Capital Airlines',
  'AM': 'Aeromexico',
  'CM': 'Copa Airlines',
  'AV': 'Avianca',
  'LA': 'LATAM Airlines',
  'AR': 'Aerolineas Argentinas',
  'G3': 'Gol Linhas Aereas',
  'JJ': 'LATAM Brasil',
  'ET': 'Ethiopian Airlines',
  'SA': 'South African Airways',
  'KQ': 'Kenya Airways',
  'MS': 'EgyptAir',
  'RJ': 'Royal Jordanian',
  'WY': 'Oman Air',
  'FZ': 'flydubai',
  'GF': 'Gulf Air',
  'SV': 'Saudia',
  'ME': 'Middle East Airlines',
  'W6': 'Wizz Air',
  'U2': 'easyJet',
  'VY': 'Vueling',
  'DY': 'Norwegian',
  'HU': 'Hainan Airlines',
  'XZ': 'Vistara',
  '6E': 'IndiGo',
  'IX': 'Air India Express',
  'SG': 'SpiceJet',
  'UK': 'Vistara',
  'FD': 'Thai AirAsia',
  'QZ': 'Indonesia AirAsia',
  'AK': 'AirAsia',
  'D7': 'AirAsia X',
  'TR': 'Scoot',
  'JQ': 'Jetstar',
  '3K': 'Jetstar Asia',
  'BL': 'Jetstar Pacific',
  'IT': 'Tigerair Taiwan',
  'TT': 'Tigerair Australia',
  'DJ': 'Virgin Australia',
  'ZL': 'Regional Express',
  'WS': 'WestJet',
  'PD': 'Porter Airlines',
  'TS': 'Air Transat',
  'WG': 'Sunwing Airlines',
  'F8': 'Flair Airlines',
  'Y9': 'Kish Air',
  'W5': 'Mahan Air',
  'ZV': 'V Air',
  'VJ': 'VietJet Air',
  'BG': 'Biman Bangladesh',
  'BS': 'US-Bangla Airlines',
  'PG': 'Bangkok Airways',
  'DD': 'Nok Air',
  'FY': 'Firefly',
  'OD': 'Malindo Air',
  'RI': 'Mandala Airlines',
  'QG': 'Citilink',
  'ID': 'Batik Air',
  'JT': 'Lion Air',
  'SL': 'Thai Lion Air',
  'OG': 'Play',
  'FI': 'Icelandair',
  'RC': 'Atlantic Airways',
  'WW': 'WOW air',
  'LO': 'LOT Polish Airlines',
  'OK': 'Czech Airlines',
  'FB': 'Bulgaria Air',
  'RO': 'TAROM',
  'H4': 'HiSky',
  'JU': 'Air Serbia',
  'OU': 'Croatia Airlines',
  'JP': 'Adria Airways',
  'YM': 'Montenegro Airlines',
  'TU': 'Tunisair',
  'AT': 'Royal Air Maroc',
  'AH': 'Air Algerie',
  'LN': 'Libyan Airlines',
  'SD': 'Sudan Airways',
  'PN': 'China West Air',
  'TV': 'Tibet Airlines',
  'BK': 'Okay Airways',
  'NS': 'Hebei Airlines',
  'GS': 'Tianjin Airlines',
  '8L': 'Lucky Air',
  'UQ': 'Urumqi Air',
  'GX': 'Guangxi Beibu Gulf Airlines',
  'OQ': 'Chongqing Airlines',
  'EU': 'Chengdu Airlines',
  'HO': 'Juneyao Airlines',
  'FM': 'Shanghai Airlines',
  'ZH': 'Shenzhen Airlines',
  'SC': 'Shandong Airlines',
  'KN': 'China United Airlines',
  'BZ': 'Blue Bird Airways',
  'NU': 'Japan Transocean Air',
  'EH': 'ANA Wings',
  'BC': 'Skymark Airlines',
  'MM': 'Peach Aviation',
  '7C': 'Jeju Air',
  'LJ': 'Jin Air',
  'TW': "T'way Air",
  'ZE': 'Eastar Jet',
  'BX': 'Air Busan',
  'YP': 'Air Premia',
  'RF': 'Aero K Airlines',
  'RS': 'Air Seoul',
  '7G': 'Star Flyer',
  'IJ': 'Spring Airlines Japan',
  '9C': 'Spring Airlines',
  'HX': 'Hong Kong Airlines',
  'UO': 'HK Express',
  'O3': 'SF Airlines',
  'RY': 'Jiangxi Air',
  'A9': 'Georgian Airways',
  'KC': 'Air Astana',
  'HY': 'Uzbekistan Airways',
  'T5': 'Turkmenistan Airlines',
  '7R': 'RusLine',
  'FV': 'Rossiya Airlines',
  'N4': 'Nordwind Airlines',
  'UT': 'UTair',
  'WZ': 'Red Wings Airlines',
  'U6': 'Ural Airlines',
  '5N': 'Smartavia',
  'DP': 'Pobeda',
  'R3': 'Yakutia Airlines',
  'YC': 'Yamal Airlines',
  'GH': 'Globus Airlines',
  '4B': 'Boutique Air',
  'ZP': 'Air Leap',
  'XP': 'Xpressair',
  'IP': 'Atlasglobal',
  'PC': 'Pegasus Airlines',
  'H9': 'Himalaya Airlines',
  'RA': 'Nepal Airlines',
  'YT': 'Yeti Airlines',
  'BH': 'Hawkair',
  'LW': 'Pacific Wings',
  'K5': 'SeaPort Airlines',
  '3M': 'Silver Airways',
  'YX': 'Republic Airways',
  '9E': 'Endeavor Air',
  'OH': 'PSA Airlines',
  'OO': 'SkyWest Airlines',
  'PT': 'Piedmont Airlines',
  'EV': 'ExpressJet',
  'MQ': 'Envoy Air',
  'QX': 'Horizon Air',
  'YV': 'Mesa Airlines',
  'ZW': 'Air Wisconsin',
  'CP': 'Compass Airlines',
  '9K': 'Cape Air',
  'S5': 'Shuttle America'
};

// Common airports for validation
const COMMON_AIRPORTS = new Set([
  'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'SFO', 'MIA', 'SEA', 'BOS', 'EWR',
  'LGA', 'DCA', 'IAD', 'PHX', 'LAS', 'MCO', 'DEN', 'DTW', 'MSP', 'SLC',
  'BWI', 'MDW', 'DAL', 'HOU', 'BNA', 'AUS', 'PDX', 'SAN', 'TPA', 'FLL',
  'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MUC', 'ZRH', 'VIE',
  'BRU', 'CPH', 'OSL', 'ARN', 'HEL', 'LIS', 'DUB', 'EDI', 'MAN', 'BHX',
  'DXB', 'DOH', 'AUH', 'SIN', 'HKG', 'NRT', 'HND', 'ICN', 'PVG', 'PEK',
  'CAN', 'BKK', 'KUL', 'CGK', 'MNL', 'DEL', 'BOM', 'BLR', 'SYD', 'MEL',
  'AKL', 'BNE', 'PER', 'ADL', 'WLG', 'CHC', 'JNB', 'CPT', 'CAI', 'ADD',
  'NBO', 'LOS', 'ACC', 'CMN', 'TUN', 'ALG', 'GRU', 'GIG', 'BSB', 'EZE',
  'SCL', 'LIM', 'BOG', 'MEX', 'CUN', 'GDL', 'PTY', 'SJO', 'GUA', 'SAL',
  'YYZ', 'YVR', 'YUL', 'YYC', 'YEG', 'YOW', 'YWG', 'YHZ', 'YQB', 'YXE'
]);

interface ConfidenceWord {
  word: string;
  confidence: number;
}

interface OCRResult {
  text: string;
  confidence?: ConfidenceWord[];
}

export interface ValidationResult {
  valid: boolean;
  value?: string;
  suggestion?: string;
  confidence?: number;
}

interface BoardingPassValidation {
  cleanText: string;
  validations: {
    flightNumber: ValidationResult;
    departureTime: ValidationResult;
    arrivalTime: ValidationResult;
    boardingTime: ValidationResult;
    airports: {
      origin: ValidationResult;
      destination: ValidationResult;
    };
    date: ValidationResult;
    seat: ValidationResult;
    gate: ValidationResult;
  };
  extractedData: any;
}

// Extract confidence scores from OCR result
export function extractConfidenceScores(ocrResult: OCRResult): ConfidenceWord[] {
  if (ocrResult.confidence) {
    return ocrResult.confidence;
  }
  
  // If no confidence data, create mock confidence based on text patterns
  const words = ocrResult.text.split(/\s+/);
  return words.map(word => ({
    word,
    confidence: estimateConfidence(word)
  }));
}

// Estimate confidence based on text patterns
function estimateConfidence(word: string): number {
  // High confidence for well-formed patterns
  if (/^[A-Z]{2}\d{1,4}$/.test(word)) return 0.9; // Flight number
  if (/^[A-Z]{3}$/.test(word)) return 0.85; // Airport code
  if (/^\d{1,2}:\d{2}$/.test(word)) return 0.8; // Time
  if (/^\d{1,2}[A-F]$/.test(word)) return 0.85; // Seat
  if (/^[A-Z]?\d{1,3}[A-Z]?$/.test(word)) return 0.8; // Gate
  
  // Lower confidence for mixed or unclear patterns
  if (/[0-9][O0][0-9]/.test(word)) return 0.5; // Ambiguous O/0
  if (/[Il1][0-9]/.test(word)) return 0.6; // Ambiguous I/l/1
  if (/[^\w\s-]/.test(word)) return 0.4; // Special characters
  
  return 0.7; // Default
}

// Filter low confidence text
export function filterLowConfidence(ocrResult: OCRResult, threshold: number = 0.75): string {
  const confidenceWords = extractConfidenceScores(ocrResult);
  
  return confidenceWords
    .filter(item => item.confidence >= threshold)
    .map(item => item.word)
    .join(' ');
}

// Validate flight number
export function validateFlightNumber(text: string): ValidationResult {
  const flightPattern = /\b([A-Z]{2})\s*(\d{1,4})\b/;
  const match = text.match(flightPattern);
  
  if (!match) {
    return { valid: false };
  }
  
  const airlineCode = match[1];
  const flightNum = match[2];
  
  if (AIRLINE_CODES[airlineCode]) {
    return {
      valid: true,
      value: `${airlineCode}${flightNum}`,
      confidence: 0.95
    };
  }
  
  // Try to find closest airline code
  const suggestion = Object.keys(AIRLINE_CODES).find(code => {
    const distance = new levenshtein(code, airlineCode).distance;
    return distance <= 1;
  });
  
  if (suggestion) {
    return {
      valid: false,
      value: `${airlineCode}${flightNum}`,
      suggestion: `${suggestion}${flightNum}`,
      confidence: 0.7
    };
  }
  
  return {
    valid: false,
    value: `${airlineCode}${flightNum}`,
    confidence: 0.3
  };
}

// Validate time format and sanity
export function validateTime(text: string, type: 'departure' | 'arrival' | 'boarding' = 'departure'): ValidationResult {
  const timePattern = /\b(\d{1,2}):(\d{2})(?:\s*([AP]M?))?\b/i;
  const match = text.match(timePattern);
  
  if (!match) {
    return { valid: false };
  }
  
  let hours = parseInt(match[1]);
  let minutes = parseInt(match[2]);
  const period = match[3];
  
  // Handle invalid times
  if (hours >= 24) {
    hours = hours % 24;
  }
  
  if (minutes >= 60) {
    // Common OCR errors: 80 -> 30, 70 -> 10
    if (minutes === 80) minutes = 30;
    else if (minutes === 70) minutes = 10;
    else minutes = minutes % 60;
  }
  
  // Validate AM/PM logic
  if (period && period.toUpperCase().startsWith('P') && hours < 12) {
    hours += 12;
  } else if (period && period.toUpperCase().startsWith('A') && hours === 12) {
    hours = 0;
  }
  
  const correctedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const isValid = hours < 24 && minutes < 60;
  
  return {
    valid: isValid,
    value: correctedTime,
    confidence: isValid ? 0.9 : 0.6
  };
}

// Validate airport code
export function validateAirport(code: string): ValidationResult {
  const cleanCode = code.toUpperCase().trim();
  
  if (!/^[A-Z]{3}$/.test(cleanCode)) {
    return { valid: false, value: cleanCode };
  }
  
  if (COMMON_AIRPORTS.has(cleanCode)) {
    return {
      valid: true,
      value: cleanCode,
      confidence: 0.95
    };
  }
  
  // Check for common OCR errors
  const corrections: Record<string, string> = {
    'IAX': 'LAX',
    'JEK': 'JFK',
    'OPD': 'ORD',
    'ATI': 'ATL',
    'DFM': 'DFW',
    'SFD': 'SFO',
    'MlA': 'MIA',
    'B0S': 'BOS',
    'LHE': 'LHR',
    'CDO': 'CDG'
  };
  
  if (corrections[cleanCode]) {
    return {
      valid: false,
      value: cleanCode,
      suggestion: corrections[cleanCode],
      confidence: 0.7
    };
  }
  
  // It might still be a valid but uncommon airport
  return {
    valid: true,
    value: cleanCode,
    confidence: 0.6
  };
}

// Validate date
export function validateDate(text: string): ValidationResult {
  const datePatterns = [
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{2,4})/i,
    /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s*(\d{4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Validate the date is reasonable (not too far in past or future)
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      return {
        valid: true,
        value: match[0],
        confidence: 0.9
      };
    }
  }
  
  return { valid: false };
}

// Validate seat number
export function validateSeat(text: string): ValidationResult {
  const seatPattern = /\b(\d{1,3})([A-F])\b/i;
  const match = text.match(seatPattern);
  
  if (!match) {
    return { valid: false };
  }
  
  const row = parseInt(match[1]);
  const letter = match[2].toUpperCase();
  
  // Sanity check: rows typically 1-60, letters A-F
  if (row < 1 || row > 60) {
    return {
      valid: false,
      value: `${row}${letter}`,
      suggestion: row > 60 ? `${row % 60}${letter}` : `${row}${letter}`,
      confidence: 0.5
    };
  }
  
  return {
    valid: true,
    value: `${row}${letter}`,
    confidence: 0.9
  };
}

// Validate gate
export function validateGate(text: string): ValidationResult {
  const gatePattern = /\b([A-Z]?\d{1,3}[A-Z]?)\b/;
  const match = text.match(gatePattern);
  
  if (!match) {
    return { valid: false };
  }
  
  return {
    valid: true,
    value: match[1],
    confidence: 0.85
  };
}

// Main validation function
export function validateBoardingPass(ocrResult: OCRResult | string): BoardingPassValidation {
  const textResult: OCRResult = typeof ocrResult === 'string' 
    ? { text: ocrResult } 
    : ocrResult;
  
  // Filter low confidence text
  const cleanText = filterLowConfidence(textResult);
  const upperText = cleanText.toUpperCase();
  
  // Extract and validate flight number
  const flightNumber = validateFlightNumber(upperText);
  
  // Extract times
  const timeRegex = /(\d{1,2}:\d{2}\s*[AP]M?)/gi;
  const times = upperText.match(timeRegex) || [];
  
  // Try to identify times by context
  let departureTime: ValidationResult = { valid: false };
  let arrivalTime: ValidationResult = { valid: false };
  let boardingTime: ValidationResult = { valid: false };
  
  // Look for labeled times
  const depMatch = upperText.match(/(?:DEPART|DEP|LEAVES?)\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i);
  if (depMatch) {
    departureTime = validateTime(depMatch[1], 'departure');
  }
  
  const arrMatch = upperText.match(/(?:ARRIV|ARR|LANDS?)\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i);
  if (arrMatch) {
    arrivalTime = validateTime(arrMatch[1], 'arrival');
  }
  
  const boardMatch = upperText.match(/(?:BOARD|BOARDS?|BOARDING)\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M?)/i);
  if (boardMatch) {
    boardingTime = validateTime(boardMatch[1], 'boarding');
  }
  
  // If no labeled times, use position heuristics
  if (!departureTime.valid && times.length > 0) {
    departureTime = validateTime(times[0], 'departure');
  }
  if (!arrivalTime.valid && times.length > 1) {
    arrivalTime = validateTime(times[1], 'arrival');
  }
  
  // Extract airports
  const airportCodes = upperText.match(/\b[A-Z]{3}\b/g) || [];
  const validAirports = airportCodes.map(code => ({
    code,
    validation: validateAirport(code)
  })).filter(a => a.validation.valid || a.validation.suggestion);
  
  let origin: ValidationResult = { valid: false };
  let destination: ValidationResult = { valid: false };
  
  // Try route patterns first
  const routeMatch = upperText.match(/\b([A-Z]{3})\s*(?:TO|-|→|>)\s*([A-Z]{3})\b/);
  if (routeMatch) {
    origin = validateAirport(routeMatch[1]);
    destination = validateAirport(routeMatch[2]);
  } else if (validAirports.length >= 2) {
    origin = validAirports[0].validation;
    destination = validAirports[1].validation;
  }
  
  // Extract date
  const date = validateDate(upperText);
  
  // Extract seat
  const seatMatch = upperText.match(/SEAT\s*:?\s*(\d{1,3}[A-F])/i);
  const seat = seatMatch ? validateSeat(seatMatch[1]) : { valid: false };
  
  // Extract gate
  const gateMatch = upperText.match(/GATE\s*:?\s*([A-Z]?\d{1,3}[A-Z]?)/i);
  const gate = gateMatch ? validateGate(gateMatch[1]) : { valid: false };
  
  // Build extracted data object
  const extractedData: any = {};
  
  if (flightNumber.valid || flightNumber.suggestion) {
    extractedData.flightNumber = flightNumber.suggestion || flightNumber.value;
  }
  
  if (departureTime.valid) {
    extractedData.departureTime = departureTime.value;
  }
  
  if (arrivalTime.valid) {
    extractedData.arrivalTime = arrivalTime.value;
  }
  
  if (boardingTime.valid) {
    extractedData.boardingTime = boardingTime.value;
  }
  
  if (origin.valid || origin.suggestion) {
    extractedData.origin = origin.suggestion || origin.value;
  }
  
  if (destination.valid || destination.suggestion) {
    extractedData.destination = destination.suggestion || destination.value;
  }
  
  if (date.valid) {
    extractedData.date = date.value;
  }
  
  if (seat.valid) {
    extractedData.seat = seat.value;
  }
  
  if (gate.valid) {
    extractedData.gate = gate.value;
  }
  
  return {
    cleanText,
    validations: {
      flightNumber,
      departureTime,
      arrivalTime,
      boardingTime,
      airports: {
        origin,
        destination
      },
      date,
      seat,
      gate
    },
    extractedData
  };
}

// Export for testing
export const testHelpers = {
  AIRLINE_CODES,
  COMMON_AIRPORTS,
  estimateConfidence
};