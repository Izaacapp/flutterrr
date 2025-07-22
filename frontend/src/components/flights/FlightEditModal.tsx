import React, { useState, useEffect } from 'react';
import { Flight } from '../../services/flight.service';
import AirportAutocomplete from './AirportAutocomplete';
import './FlightEditModal.css';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface FlightEditModalProps {
  flight: Flight;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Flight>) => Promise<void>;
}

export const FlightEditModal: React.FC<FlightEditModalProps> = ({ flight, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    airline: flight.airline || '',
    flightNumber: flight.flightNumber || '',
    origin: {
      airportCode: flight.origin.airportCode,
      city: flight.origin.city,
      country: flight.origin.country
    },
    destination: {
      airportCode: flight.destination.airportCode,
      city: flight.destination.city,
      country: flight.destination.country
    },
    scheduledDepartureTime: flight.scheduledDepartureTime || '',
    seatNumber: flight.seatNumber || '',
    status: flight.status
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        airline: flight.airline || '',
        flightNumber: flight.flightNumber || '',
        origin: {
          airportCode: flight.origin.airportCode,
          city: flight.origin.city,
          country: flight.origin.country
        },
        destination: {
          airportCode: flight.destination.airportCode,
          city: flight.destination.city,
          country: flight.destination.country
        },
        scheduledDepartureTime: flight.scheduledDepartureTime ? 
          new Date(flight.scheduledDepartureTime).toISOString().split('T')[0] : '',
        seatNumber: flight.seatNumber || '',
        status: flight.status
      });
    }
  }, [flight, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.origin.airportCode || !formData.destination.airportCode || !formData.scheduledDepartureTime) {
      alert('Please fill in all required fields: Departure Airport, Arrival Airport, and Date');
      return;
    }
    
    setSaving(true);
    try {
      await onSave({
        ...formData,
        scheduledDepartureTime: new Date(formData.scheduledDepartureTime).toISOString(),
        scheduledArrivalTime: flight.scheduledArrivalTime, // Keep existing arrival time
        confirmationCode: flight.confirmationCode // Keep existing confirmation code
      });
      onClose();
    } catch (error) {
      console.error('Error saving flight:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Flight</h2>
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
                <option value="">Select airline (optional)</option>
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
              onChange={(airport: Airport) => setFormData({...formData, origin: {airportCode: airport.code, city: airport.city, country: airport.country}})}
              placeholder="Enter departure airport"
              required={true}
            />
            
            <AirportAutocomplete
              label="Arrival Airport"
              value={formData.destination.airportCode}
              onChange={(airport: Airport) => setFormData({...formData, destination: {airportCode: airport.code, city: airport.city, country: airport.country}})}
              placeholder="Enter arrival airport"
              required={true}
            />
            
            <div className="form-group">
              <label>Flight Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.scheduledDepartureTime}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};