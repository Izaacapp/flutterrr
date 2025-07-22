import { safeStrictDateExtraction } from "./dateStrict";
import * as fs from 'fs';
import * as path from 'path';

// Cache for airport data to avoid repeated file reads
const airportCache: Map<string, { lat: number; lng: number; city?: string; state?: string; country?: string }> = new Map();

// Load airports data from JSON file
let airportsData: Array<{
  code: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  state?: string;
  country?: string;
}> = [];

// Load airports data on module initialization
try {
  const airportsPath = path.join(__dirname, '../data/airports.json');
  const airportsJson = fs.readFileSync(airportsPath, 'utf8');
  airportsData = JSON.parse(airportsJson);
  console.log(`Loaded ${airportsData.length} airports from airports.json`);
} catch (error) {
  console.warn('Failed to load airports.json, using fallback data:', error);
}

// Pre-populate with some common airports for offline fallback
const fallbackAirports: Record<string, { lat: number; lng: number }> = {
  'JFK': { lat: 40.6413, lng: -73.7781 },
  'LAX': { lat: 33.9425, lng: -118.4081 },
  'ORD': { lat: 41.9742, lng: -87.9073 },
  'DFW': { lat: 32.8975, lng: -97.0403 },
  'ATL': { lat: 33.6407, lng: -84.4277 },
  'SFO': { lat: 37.6213, lng: -122.3790 },
  'MIA': { lat: 25.7959, lng: -80.2870 },
  'SEA': { lat: 47.4502, lng: -122.3088 },
  'BOS': { lat: 42.3656, lng: -71.0096 },
  'LAS': { lat: 36.0840, lng: -115.1537 },
  'MCO': { lat: 28.4294, lng: -81.3089 },
  // International airports
  'HND': { lat: 35.5494, lng: 139.7798 }, // Tokyo Haneda
  'NRT': { lat: 35.7720, lng: 140.3928 }, // Tokyo Narita
  'LHR': { lat: 51.4700, lng: -0.4543 }, // London Heathrow
  'CDG': { lat: 49.0097, lng: 2.5479 }, // Paris Charles de Gaulle
  'FRA': { lat: 50.0264, lng: 8.5431 }, // Frankfurt
  'AMS': { lat: 52.3105, lng: 4.7683 }, // Amsterdam
  'ICN': { lat: 37.4602, lng: 126.4407 }, // Seoul Incheon
  'SIN': { lat: 1.3644, lng: 103.9915 }, // Singapore
  'HKG': { lat: 22.3080, lng: 113.9185 }, // Hong Kong
  'DXB': { lat: 25.2532, lng: 55.3657 }, // Dubai
};

/**
 * Convert DMS (Degrees Minutes Seconds) to decimal degrees
 * Example: "35-26-04.0000N" -> 35.434444
 */
function dmsToDecimal(dms: string): number {
  // Parse format like "35-26-04.0000N" or "082-32-33.8240W"
  const parts = dms.match(/(\d+)-(\d+)-(\d+\.?\d*)(N|S|E|W)/);
  if (!parts) return 0;

  const degrees = parseInt(parts[1]);
  const minutes = parseInt(parts[2]);
  const seconds = parseFloat(parts[3]);
  const direction = parts[4];

  let decimal = degrees + minutes / 60 + seconds / 3600;

  // Make negative for South or West
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

/**
 * Get airport data from airports.json
 */
function getAirportDataFromJson(airportCode: string): { lat: number; lng: number; city?: string; state?: string; country?: string } | null {
  const airport = airportsData.find(a => a.code === airportCode.toUpperCase());
  if (airport) {
    return {
      lat: airport.lat,
      lng: airport.lng,
      city: airport.city,
      state: airport.state,
      country: airport.country
    };
  }
  return null;
}

/**
 * Fetch airport data from AviationAPI (fallback for airports not in JSON)
 */
async function fetchAirportDataFromAPI(airportCode: string): Promise<{ lat: number; lng: number; city?: string; state?: string } | null> {
  try {
    const response = await fetch(`https://api.aviationapi.com/v1/airports?apt=${airportCode}`);
    if (!response.ok) {
      console.error(`Failed to fetch airport data for ${airportCode}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Check if we got an error response
    if (data.status === 'error' || !data.latitude || !data.longitude) {
      return null;
    }

    // Convert DMS to decimal degrees
    const lat = dmsToDecimal(data.latitude);
    const lng = dmsToDecimal(data.longitude);

    return {
      lat,
      lng,
      city: data.city,
      state: data.state_full
    };
  } catch (error) {
    console.error(`Error fetching airport data for ${airportCode}:`, error);
    return null;
  }
}

/**
 * Get airport coordinates, using cache first, then JSON data, then API, then fallback
 */
async function getAirportCoordinates(airportCode: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  const cached = airportCache.get(airportCode);
  if (cached) {
    return cached;
  }

  // Try to get from airports.json first
  const jsonData = getAirportDataFromJson(airportCode);
  if (jsonData) {
    airportCache.set(airportCode, jsonData);
    return jsonData;
  }

  // Fallback to API for airports not in JSON
  const apiData = await fetchAirportDataFromAPI(airportCode);
  if (apiData) {
    airportCache.set(airportCode, apiData);
    return apiData;
  }

  // Use hardcoded fallback data as last resort
  const fallback = fallbackAirports[airportCode];
  if (fallback) {
    airportCache.set(airportCode, fallback);
    return fallback;
  }

  return null;
}

/**
 * Calculate the distance between two airports in miles using the Haversine formula
 */
export async function calculateFlightDistance(originCode: string, destinationCode: string): Promise<number> {
  const [origin, destination] = await Promise.all([
    getAirportCoordinates(originCode),
    getAirportCoordinates(destinationCode)
  ]);

  if (!origin || !destination) {
    // If we still don't have coordinates, use estimate
    return estimateDistance(originCode, destinationCode);
  }

  return calculateHaversineDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );
}

/**
 * Calculate distance using Haversine formula
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate distance for airports not in our database
 */
function estimateDistance(origin: string, destination: string): number {
  // Common route estimates (in miles)
  const commonRoutes: Record<string, number> = {
    'JFK-LAX': 2475,
    'LAX-JFK': 2475,
    'ORD-LAX': 1744,
    'LAX-ORD': 1744,
    'ATL-LAX': 1946,
    'LAX-ATL': 1946,
    'JFK-MIA': 1089,
    'MIA-JFK': 1089,
    'SFO-JFK': 2586,
    'JFK-SFO': 2586,
    'BOS-LAX': 2611,
    'LAX-BOS': 2611,
    'DFW-LAX': 1235,
    'LAX-DFW': 1235,
    'SEA-LAX': 954,
    'LAX-SEA': 954,
    'DEN-LAX': 862,
    'LAX-DEN': 862,
    'PHX-LAX': 370,
    'LAX-PHX': 370,
    'LAS-LAX': 236,
    'LAX-LAS': 236,
    // Add more common routes
  };

  const routeKey = `${origin}-${destination}`;
  return commonRoutes[routeKey] || 500; // Default to 500 miles if unknown
}

/**
 * Get airport information including city, state, and coordinates
 */
export async function getAirportInfo(code: string): Promise<{ city?: string; state?: string; country?: string; lat?: number; lng?: number } | null> {
  // First check cache
  const cached = airportCache.get(code);
  if (cached) {
    return cached;
  }

  // Try to get from airports.json first
  const jsonData = getAirportDataFromJson(code);
  if (jsonData) {
    airportCache.set(code, jsonData);
    return jsonData;
  }

  // Fallback to API
  const apiData = await fetchAirportDataFromAPI(code);
  if (apiData) {
    const enrichedApiData = { ...apiData, country: 'Unknown' };
    airportCache.set(code, enrichedApiData);
    return enrichedApiData;
  }

  // Use hardcoded fallback data as last resort
  const fallbackInfo: Record<string, { city: string; state?: string; country: string }> = {
    'JFK': { city: 'New York', state: 'New York', country: 'United States' },
    'LAX': { city: 'Los Angeles', state: 'California', country: 'United States' },
    'ORD': { city: 'Chicago', state: 'Illinois', country: 'United States' },
    'DFW': { city: 'Dallas', state: 'Texas', country: 'United States' },
    'ATL': { city: 'Atlanta', state: 'Georgia', country: 'United States' },
    'SFO': { city: 'San Francisco', state: 'California', country: 'United States' },
    'MIA': { city: 'Miami', state: 'Florida', country: 'United States' },
    'SEA': { city: 'Seattle', state: 'Washington', country: 'United States' },
    'BOS': { city: 'Boston', state: 'Massachusetts', country: 'United States' },
    'LAS': { city: 'Las Vegas', state: 'Nevada', country: 'United States' },
    'MCO': { city: 'Orlando', state: 'Florida', country: 'United States' },
    'HND': { city: 'Tokyo', country: 'Japan' },
    'NRT': { city: 'Tokyo', country: 'Japan' },
  };

  const info = fallbackInfo[code];
  const coords = fallbackAirports[code];
  
  if (info || coords) {
    const combined = { ...info, ...coords };
    airportCache.set(code, combined);
    return combined;
  }

  return null;
}