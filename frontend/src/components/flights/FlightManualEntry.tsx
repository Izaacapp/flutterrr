import React, { useState } from 'react';
import { flightService } from '../../services/flight.service';
import './FlightEditModal.css';

interface FlightManualEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flight: any) => void;
}

export const FlightManualEntry: React.FC<FlightManualEntryProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    airline: 'Delta',
    flightNumber: '',
    confirmationCode: '',
    origin: {
      airportCode: '',
      city: '',
      gate: ''
    },
    destination: {
      airportCode: '',
      city: ''
    },
    scheduledDepartureTime: '',
    scheduledArrivalTime: '',
    seatNumber: '',
    status: 'upcoming' as const
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const flight = await flightService.addFlightManually({
        ...formData,
        scheduledDepartureTime: new Date(formData.scheduledDepartureTime),
        scheduledArrivalTime: new Date(formData.scheduledArrivalTime)
      });
      onSave(flight);
      onClose();
      // Reset form
      setFormData({
        airline: 'Delta',
        flightNumber: '',
        confirmationCode: '',
        origin: {
          airportCode: '',
          city: '',
          gate: ''
        },
        destination: {
          airportCode: '',
          city: ''
        },
        scheduledDepartureTime: '',
        scheduledArrivalTime: '',
        seatNumber: '',
        status: 'upcoming'
      });
    } catch (error) {
      console.error('Error adding flight:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Flight Manually</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Airline</label>
              <select
                value={formData.airline}
                onChange={e => setFormData({...formData, airline: e.target.value})}
                required
              >
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
                placeholder="e.g., DL123"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Confirmation Code</label>
              <input
                type="text"
                value={formData.confirmationCode}
                onChange={e => setFormData({...formData, confirmationCode: e.target.value.toUpperCase()})}
                placeholder="e.g., ABC123"
                maxLength={6}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Origin Airport</label>
              <input
                type="text"
                value={formData.origin.airportCode}
                onChange={e => setFormData({...formData, origin: {...formData.origin, airportCode: e.target.value.toUpperCase()}})}
                placeholder="e.g., JFK"
                maxLength={3}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Origin City</label>
              <input
                type="text"
                value={formData.origin.city}
                onChange={e => setFormData({...formData, origin: {...formData.origin, city: e.target.value}})}
                placeholder="e.g., New York"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Gate</label>
              <input
                type="text"
                value={formData.origin.gate}
                onChange={e => setFormData({...formData, origin: {...formData.origin, gate: e.target.value}})}
                placeholder="e.g., A12"
              />
            </div>
            
            <div className="form-group">
              <label>Destination Airport</label>
              <input
                type="text"
                value={formData.destination.airportCode}
                onChange={e => setFormData({...formData, destination: {...formData.destination, airportCode: e.target.value.toUpperCase()}})}
                placeholder="e.g., LAX"
                maxLength={3}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Destination City</label>
              <input
                type="text"
                value={formData.destination.city}
                onChange={e => setFormData({...formData, destination: {...formData.destination, city: e.target.value}})}
                placeholder="e.g., Los Angeles"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Departure Time</label>
              <input
                type="datetime-local"
                value={formData.scheduledDepartureTime}
                onChange={e => setFormData({...formData, scheduledDepartureTime: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Arrival Time</label>
              <input
                type="datetime-local"
                value={formData.scheduledArrivalTime}
                onChange={e => setFormData({...formData, scheduledArrivalTime: e.target.value})}
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