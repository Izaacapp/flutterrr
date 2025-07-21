const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export interface Flight {
  _id: string;
  userId: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  confirmationCode: string;
  eticketNumber?: string;
  origin: {
    airportCode: string;
    airportName?: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
  };
  destination: {
    airportCode: string;
    airportName?: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
  };
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  seatNumber?: string;
  seatClass: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  boardingGroup?: string;
  distance?: number;
  duration?: number;
  points?: number;
  boardingPassUrl?: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'delayed';
  createdAt: string;
  updatedAt: string;
}

export interface FlightStats {
  summary: {
    totalFlights: number;
    totalDistance: number;
    totalPoints: number;
    uniqueAirlines: number;
    uniqueDestinations: number;
  };
  flightsByMonth: Array<{
    _id: number;
    count: number;
    distance: number;
    points: number;
  }>;
  topRoutes: Array<{
    _id: {
      origin: string;
      destination: string;
    };
    count: number;
    totalDistance: number;
  }>;
}

class FlightService {
  private getAuthHeaders() {
    const token = localStorage.getItem('passport_buddy_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async uploadBoardingPass(file: File): Promise<Flight> {
    const formData = new FormData();
    formData.append('boardingPass', file);

    const response = await fetch(`${API_URL}/flights/upload-boarding-pass`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload boarding pass');
    }

    const data = await response.json();
    return data.flight;
  }

  async addFlightManually(flightData: Partial<Flight>): Promise<Flight> {
    const response = await fetch(`${API_URL}/flights/manual-entry`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flightData)
    });

    if (!response.ok) {
      throw new Error('Failed to add flight');
    }

    const data = await response.json();
    return data.flight;
  }

  async getMyFlights(params?: {
    status?: string;
    airline?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    flights: Flight[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}/flights/my-flights?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get flights');
    }

    return response.json();
  }

  async getFlightStats(year?: number): Promise<FlightStats> {
    const queryParams = new URLSearchParams();
    if (year) {
      queryParams.append('year', String(year));
    }

    const response = await fetch(`${API_URL}/flights/stats?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get flight stats');
    }

    return response.json();
  }

  async updateFlightStatus(flightId: string, status: Flight['status']): Promise<Flight> {
    const response = await fetch(`${API_URL}/flights/${flightId}/status`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update flight status');
    }

    const data = await response.json();
    return data.flight;
  }

  async deleteFlight(flightId: string): Promise<void> {
    const response = await fetch(`${API_URL}/flights/${flightId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete flight');
    }
  }
}

export const flightService = new FlightService();