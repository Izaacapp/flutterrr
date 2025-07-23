import { Flight } from '../../../shared/src';

export type { Flight };

export interface FlightStats {
  totalFlights: number;
  totalDistance: number;
  totalFlightTime: number;
  uniqueAirports: number;
  uniqueCountries: number;
  uniqueAirlines: number;
  carbonEmissions: number;
  averageFlightDistance: number;
  totalPoints?: number;
  uniqueDestinations?: number;
  longestFlight?: Flight;
  shortestFlight?: Flight;
  mostVisitedAirport?: {
    code: string;
    name: string;
    city: string;
    country: string;
    visits: number;
  };
  favoriteAirline?: {
    code: string;
    name: string;
    flights: number;
  };
  flightsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('passport_buddy_token');
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export class FlightService {
  async uploadBoardingPass(file: File): Promise<Flight> {
    const formData = new FormData();
    formData.append('boardingPass', file);
    
    const response = await makeRequest('/api/v1/flights/upload-boarding-pass', {
      method: 'POST',
      body: formData,
      headers: {}, // Let fetch set Content-Type for FormData
    });
    
    return response.flight;
  }

  async createManualFlight(flightData: any) {
    return makeRequest('/api/v1/flights/manual-entry', {
      method: 'POST',
      body: JSON.stringify(flightData),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getMyFlights() {
    return makeRequest('/api/v1/flights/my-flights');
  }

  async getFlightById(flightId: string) {
    return makeRequest(`/api/v1/flights/${flightId}`);
  }

  async updateFlight(flightId: string, updates: any) {
    return makeRequest(`/api/v1/flights/${flightId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async deleteFlight(flightId: string) {
    return makeRequest(`/api/v1/flights/${flightId}`, { method: 'DELETE' });
  }

  async getFlightStats(year?: number): Promise<FlightStats> {
    const endpoint = year ? `/api/v1/flights/stats?year=${year}` : '/api/v1/flights/stats';
    const response = await makeRequest(endpoint);
    
    // Map the backend response structure to our FlightStats interface
    const summary = response.summary || {};
    
    return {
      totalFlights: summary.totalFlights || 0,
      totalDistance: summary.totalDistance || 0,
      totalPoints: summary.totalPoints || 0,
      uniqueDestinations: summary.uniqueDestinations || 0,
      uniqueAirlines: summary.uniqueAirlines || 0,
      totalFlightTime: 0, // Not provided by backend
      uniqueAirports: summary.uniqueDestinations || 0, // Using destinations as proxy
      uniqueCountries: summary.uniqueDestinations || 0, // Using destinations as proxy
      carbonEmissions: 0, // Not provided by backend
      averageFlightDistance: summary.totalFlights > 0 ? Math.round(summary.totalDistance / summary.totalFlights) : 0,
      flightsByMonth: response.flightsByMonth || []
    };
  }

  getAirlineLogoUrl(airlineCode: string): string {
    return `https://images.kiwi.com/airlines/64x64/${airlineCode.toUpperCase()}.png`;
  }
}

export const flightService = new FlightService();