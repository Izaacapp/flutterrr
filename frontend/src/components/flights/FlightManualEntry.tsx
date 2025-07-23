import React, { useState } from 'react';
import { flightService } from '../../services/flight.service';
import AirportAutocomplete from './AirportAutocomplete';
import './FlightEditModal.css';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface FlightManualEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flight: any) => void;
}

export const FlightManualEntry: React.FC<FlightManualEntryProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    origin: {
      airportCode: '',
      city: ''
    },
    destination: {
      airportCode: '',
      city: ''
    },
    scheduledDepartureTime: '',
    seatNumber: '',
    status: 'upcoming' as const
  });
  const [saving, setSaving] = useState(false);

  const handleOriginChange = (airport: Airport) => {
    setFormData(prev => ({
      ...prev,
      origin: {
        ...prev.origin,
        airportCode: airport.code,
        city: airport.city
      }
    }));
  };

  const handleDestinationChange = (airport: Airport) => {
    setFormData(prev => ({
      ...prev,
      destination: {
        ...prev.destination,
        airportCode: airport.code,
        city: airport.city
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.origin.airportCode || !formData.destination.airportCode || !formData.scheduledDepartureTime) {
      alert('Please fill in all required fields: Departure Airport, Arrival Airport, and Date');
      return;
    }
    
    setSaving(true);
    try {
      const flightData: any = {
        origin: formData.origin,
        destination: formData.destination,
        scheduledDepartureTime: new Date(formData.scheduledDepartureTime),
        status: formData.status
      };
      
      // Add optional fields if they have values
      if (formData.airline) flightData.airline = formData.airline;
      if (formData.flightNumber) flightData.flightNumber = formData.flightNumber;
      if (formData.seatNumber) flightData.seatNumber = formData.seatNumber;

      const response = await flightService.createManualFlight(flightData);
      onSave(response.flight || response);
      onClose();
      // Reset form
      setFormData({
        airline: '',
        flightNumber: '',
        origin: {
          airportCode: '',
          city: ''
        },
        destination: {
          airportCode: '',
          city: ''
        },
        scheduledDepartureTime: '',
        seatNumber: '',
        status: 'upcoming'
      });
    } catch (error: any) {
      console.error('Error adding flight:', error);
      alert(error.message || 'Failed to add flight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manual Boarding Pass Entry</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="form-info" style={{ padding: '10px', backgroundColor: '#f0f7ff', borderRadius: '4px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#4a5568' }}>
            ✈️ One-way ticket entry - Required: Departure & Arrival airports, Date
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Airline</label>
              <select
                value={formData.airline}
                onChange={e => setFormData({...formData, airline: e.target.value})}
              >
                <option value="">Select Airline (optional)</option>
                <option value="Delta">Delta</option>
                <option value="American">American</option>
                <option value="United">United</option>
                <option value="Southwest">Southwest</option>
                <option value="Spirit">Spirit</option>
                <option value="Frontier">Frontier</option>
                <option value="JetBlue">JetBlue</option>
                <option value="Alaska">Alaska</option>
                <option value="Hawaiian">Hawaiian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Flight Number</label>
              <input
                type="text"
                value={formData.flightNumber}
                onChange={e => setFormData({...formData, flightNumber: e.target.value})}
                placeholder="e.g., DL123 (optional)"
              />
            </div>
            
            
            <AirportAutocomplete
              label="Departure Airport"
              value={formData.origin.airportCode}
              onChange={handleOriginChange}
              placeholder="Enter departure airport"
              required={true}
            />
            
            
            <AirportAutocomplete
              label="Arrival Airport"
              value={formData.destination.airportCode}
              onChange={handleDestinationChange}
              placeholder="Enter arrival airport"
              required={true}
            />
            
            <div className="form-group">
              <label>Flight Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.scheduledDepartureTime ? formData.scheduledDepartureTime.split('T')[0] : ''}
                onChange={e => setFormData({...formData, scheduledDepartureTime: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Seat Number</label>
              <input
                type="text"
                value={formData.seatNumber}
                onChange={e => setFormData({...formData, seatNumber: e.target.value})}
                placeholder="e.g., 12A"
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Adding...' : 'Add Flight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};