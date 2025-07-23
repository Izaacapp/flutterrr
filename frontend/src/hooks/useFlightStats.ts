import { useState, useEffect } from 'react';
import { flightService, FlightStats } from '../services/flight.service';

export function useFlightStats() {
  const [stats, setStats] = useState<FlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await flightService.getFlightStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching flight stats:', err);
      setError('Failed to load travel statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen for flight-related events to refresh stats
    const handleFlightUpdate = () => {
      fetchStats();
    };

    window.addEventListener('flight-created', handleFlightUpdate);
    window.addEventListener('flight-updated', handleFlightUpdate);
    window.addEventListener('flight-deleted', handleFlightUpdate);

    return () => {
      window.removeEventListener('flight-created', handleFlightUpdate);
      window.removeEventListener('flight-updated', handleFlightUpdate);
      window.removeEventListener('flight-deleted', handleFlightUpdate);
    };
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}