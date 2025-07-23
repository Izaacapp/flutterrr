// Shared flight data types for consistency across all platforms

export type FlightStatus = 'upcoming' | 'completed' | 'cancelled' | 'delayed' | 'in-flight';

export type AirlineCode = 
  | 'AA' // American Airlines
  | 'DL' // Delta Air Lines
  | 'UA' // United Airlines
  | 'WN' // Southwest Airlines
  | 'NK' // Spirit Airlines
  | 'F9' // Frontier Airlines
  | 'B6' // JetBlue Airways
  | 'AS' // Alaska Airlines
  | 'HA' // Hawaiian Airlines
  | 'OTHER';

export interface AirportLocation {
  airportCode: string; // IATA 3-letter code (e.g., LAX, JFK)
  airportName?: string;
  city: string;
  country: string;
  terminal?: string;
  gate?: string;
}

export interface FlightTiming {
  scheduledDepartureTime: string; // ISO 8601 format
  scheduledArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  boardingTime?: string;
}

export interface BoardingDetails {
  seatNumber: string;
  boardingGroup?: string;
  boardingZone?: string;
  sequenceNumber?: string;
  classOfService?: 'economy' | 'premium-economy' | 'business' | 'first';
}

export interface BarcodeData {
  type: 'PDF417' | 'QR' | 'AZTEC' | 'OTHER';
  value: string;
}

export interface FlightCore {
  airline: string; // Full airline name
  airlineCode?: AirlineCode;
  airlineLogo?: string; // URL to airline logo
  flightNumber: string;
  confirmationCode: string;
  eticketNumber?: string;
}

export interface FlightRoute {
  origin: AirportLocation;
  destination: AirportLocation;
  distance?: number; // in miles
  duration?: number; // in minutes
}

export interface FlightDocuments {
  boardingPassUrl?: string; // S3 URL
  barcode?: BarcodeData;
}

// Main Flight interface that combines all aspects
export interface Flight extends FlightCore, FlightRoute, FlightTiming, BoardingDetails, FlightDocuments {
  _id?: string;
  userId: string;
  status: FlightStatus;
  points?: number; // Loyalty points earned
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Flight statistics interfaces
export interface FlightStats {
  summary: {
    totalFlights: number;
    totalDistance: number;
    totalDuration: number;
    totalPoints: number;
    uniqueAirlines: number;
    uniqueDestinations: number;
    uniqueCountries: number;
  };
  flightsByMonth: Array<{
    month: number;
    year: number;
    count: number;
    distance: number;
    points: number;
  }>;
  topRoutes: Array<{
    origin: string;
    destination: string;
    count: number;
    totalDistance: number;
  }>;
  airlineBreakdown: Array<{
    airline: string;
    count: number;
    distance: number;
    points: number;
  }>;
  statusBreakdown: {
    upcoming: number;
    completed: number;
    cancelled: number;
    delayed: number;
  };
}

// Boarding pass parser output format
export interface ParsedBoardingPass {
  passenger: {
    firstName: string;
    lastName: string;
    frequentFlyerNumber?: string;
  };
  flight: FlightCore;
  route: FlightRoute;
  timing: Partial<FlightTiming>; // Parser may not extract all times
  boarding: Partial<BoardingDetails>;
  barcode?: BarcodeData;
  confidence: {
    overall: number; // 0-100
    fields: Record<string, number>;
  };
  parserVersion: string;
  rawText?: string;
}

// API response types
export interface FlightListResponse {
  flights: Flight[];
  total: number;
  hasMore: boolean;
  page?: number;
  limit?: number;
}

export interface FlightUploadResponse {
  success: boolean;
  flight?: Flight;
  parsedData?: ParsedBoardingPass;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}