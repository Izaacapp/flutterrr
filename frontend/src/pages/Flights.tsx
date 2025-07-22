import React, { useState, useEffect, useRef } from 'react';
import { flightService, Flight, FlightStats } from '../services/flight.service';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { FlightEditModal } from '../components/flights/FlightEditModal';
import { FlightManualEntry } from '../components/flights/FlightManualEntry';
import { CameraIcon, UploadIcon, PlusIcon, EditIcon, TrashIcon } from '../components/ui/Icons';
import '../assets/styles/Flights.css';

export const Flights: React.FC = () => {
  const { showToast } = useToast();
  const { refreshUserProfile } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<FlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPass, setUploadingPass] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFlights();
    loadStats();
  }, []);

  const loadFlights = async () => {
    try {
      const response = await flightService.getMyFlights();
      setFlights(response.flights);
    } catch (error) {
      console.error('Error loading flights:', error);
      showToast('Failed to load flights', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const statsData = await flightService.getFlightStats(currentYear);
      setStats(statsData);
      
      // Sync user miles to ensure consistency
      await flightService.syncUserMiles();
      
      // Refresh user profile to update sidebar and profile page data
      await refreshUserProfile();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPass(true);
    try {
      const flight = await flightService.uploadBoardingPass(file);
      setFlights([flight, ...flights]);
      showToast('Boarding pass uploaded successfully!', 'success');
      loadStats(); // Reload stats to update points
    } catch (error) {
      console.error('Error uploading boarding pass:', error);
      showToast('Failed to upload boarding pass', 'error');
    } finally {
      setUploadingPass(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleUpdateFlight = async (flightId: string, updates: Partial<Flight>) => {
    try {
      const updatedFlight = await flightService.updateFlight(flightId, updates);
      setFlights(flights.map(f => f._id === flightId ? updatedFlight : f));
      showToast('Flight updated successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error updating flight:', error);
      showToast('Failed to update flight', 'error');
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    
    try {
      await flightService.deleteFlight(flightId);
      setFlights(flights.filter(f => f._id !== flightId));
      showToast('Flight deleted successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error deleting flight:', error);
      showToast('Failed to delete flight', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  const upcomingFlights = flights.filter(f => f.status === 'upcoming');
  const completedFlights = flights.filter(f => f.status === 'completed');

  return (
    <div className="flights-container">
      <div className="flights-header">
        <h1>My Flights</h1>
        <div className="flights-actions">
          <button 
            className="camera-btn"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploadingPass}
          >
            <CameraIcon className="icon" />
          </button>
          <button 
            className="upload-pass-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPass}
          >
            <UploadIcon className="icon" />
            {uploadingPass ? 'Uploading...' : 'Upload'}
          </button>
          <button 
            className="manual-entry-btn"
            onClick={() => setShowManualEntry(!showManualEntry)}
          >
            <PlusIcon className="icon" />
            Manual Entry
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {stats && (
        <div className="flight-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.summary.totalFlights}</div>
            <div className="stat-label">Total Flights</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.summary.totalDistance.toLocaleString()}</div>
            <div className="stat-label">Miles Traveled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.summary.totalHours.toLocaleString()}</div>
            <div className="stat-label">Flight Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.summary.uniqueDestinations}</div>
            <div className="stat-label">Cities Visited</div>
          </div>
        </div>
      )}

      <div className="flights-tabs">
        <button
          className={`tab ${selectedTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setSelectedTab('upcoming')}
        >
          Upcoming ({upcomingFlights.length})
        </button>
        <button
          className={`tab ${selectedTab === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedTab('completed')}
        >
          Completed ({completedFlights.length})
        </button>
      </div>

      <div className="flights-list">
        {loading ? (
          <div className="loading">Loading flights...</div>
        ) : (
          <>
            {selectedTab === 'upcoming' && upcomingFlights.map(flight => (
              <FlightCard 
                key={flight._id} 
                flight={flight} 
                onEdit={() => setEditingFlight(flight)}
                onDelete={() => handleDeleteFlight(flight._id)}
              />
            ))}
            {selectedTab === 'completed' && completedFlights.map(flight => (
              <FlightCard 
                key={flight._id} 
                flight={flight} 
                onEdit={() => setEditingFlight(flight)}
                onDelete={() => handleDeleteFlight(flight._id)}
              />
            ))}
            {((selectedTab === 'upcoming' && upcomingFlights.length === 0) ||
              (selectedTab === 'completed' && completedFlights.length === 0)) && (
              <div className="no-flights">
                No {selectedTab} flights found. Upload a boarding pass to get started!
              </div>
            )}
          </>
        )}
      </div>
      
      {editingFlight && (
        <FlightEditModal
          flight={editingFlight}
          isOpen={!!editingFlight}
          onClose={() => setEditingFlight(null)}
          onSave={async (updates) => {
            await handleUpdateFlight(editingFlight._id, updates);
            setEditingFlight(null);
          }}
        />
      )}
      
      {showManualEntry && (
        <FlightManualEntry
          isOpen={showManualEntry}
          onClose={() => setShowManualEntry(false)}
          onSave={(flight) => {
            setFlights([flight, ...flights]);
            setShowManualEntry(false);
            loadStats();
          }}
        />
      )}
    </div>
  );
};

interface FlightCardProps {
  flight: Flight;
  onEdit: () => void;
  onDelete: () => void;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div className="flight-card">
      <div className="flight-header">
        <div className="airline-info">
          <span className="airline">{flight.airline}</span>
          <span className="flight-number">{flight.flightNumber}</span>
        </div>
        <div className="flight-date">
          {formatDate(flight.scheduledDepartureTime)}
        </div>
      </div>
      
      <div className="flight-route">
        <div className="airport">
          <div className="airport-code">{flight.origin.airportCode}</div>
          <div className="airport-city">{flight.origin.city}</div>
        </div>
        
        <div className="flight-path">
          <div className="path-line"></div>
          <svg className="plane-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10.5 4.5L16 10M16 10L10.5 15.5M16 10H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="airport">
          <div className="airport-code">{flight.destination.airportCode}</div>
          <div className="airport-city">{flight.destination.city}</div>
        </div>
      </div>
      
      <div className="flight-details">
        <div className="detail">
          <span className="label">Seat:</span>
          <span className="value">{flight.seatNumber || 'N/A'}</span>
        </div>
        {flight.flightHours && (
          <div className="detail">
            <span className="label">Hours:</span>
            <span className="value">{flight.flightHours}</span>
          </div>
        )}
      </div>
      
      <div className="flight-actions">
        <button className="edit-btn" onClick={onEdit}>
          <EditIcon className="icon" />
        </button>
        <button className="delete-btn" onClick={onDelete}>
          <TrashIcon className="icon" />
        </button>
      </div>
    </div>
  );
};