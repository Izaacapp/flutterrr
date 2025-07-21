import React, { useState, useEffect } from 'react';
import { Flight } from '../../services/flight.service';
import './FlightEditModal.css';

interface FlightEditModalProps {
  flight: Flight;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Flight>) => Promise<void>;
}

export const FlightEditModal: React.FC<FlightEditModalProps> = ({ flight, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    flightNumber: flight.flightNumber,
    confirmationCode: flight.confirmationCode,
    origin: {
      airportCode: flight.origin.airportCode,
      city: flight.origin.city,
      gate: flight.origin.gate || ''
    },
    destination: {
      airportCode: flight.destination.airportCode,
      city: flight.destination.city
    },
    scheduledDepartureTime: new Date(flight.scheduledDepartureTime).toISOString().slice(0, 16),
    scheduledArrivalTime: new Date(flight.scheduledArrivalTime).toISOString().slice(0, 16),
    seatNumber: flight.seatNumber || '',
    status: flight.status
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        flightNumber: flight.flightNumber,
        confirmationCode: flight.confirmationCode,
        origin: {
          airportCode: flight.origin.airportCode,
          city: flight.origin.city,
          gate: flight.origin.gate || ''
        },
        destination: {
          airportCode: flight.destination.airportCode,
          city: flight.destination.city
        },
        scheduledDepartureTime: new Date(flight.scheduledDepartureTime).toISOString().slice(0, 16),
        scheduledArrivalTime: new Date(flight.scheduledArrivalTime).toISOString().slice(0, 16),
        seatNumber: flight.seatNumber || '',
        status: flight.status
      });
    }
  }, [flight, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        scheduledDepartureTime: new Date(formData.scheduledDepartureTime),
        scheduledArrivalTime: new Date(formData.scheduledArrivalTime)
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
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Flight Number</label>
              <input
                type="text"
                value={formData.flightNumber}
                onChange={e => setFormData({...formData, flightNumber: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Confirmation Code</label>
              <input
                type="text"
                value={formData.confirmationCode}
                onChange={e => setFormData({...formData, confirmationCode: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Origin Airport</label>
              <input
                type="text"
                value={formData.origin.airportCode}
                onChange={e => setFormData({...formData, origin: {...formData.origin, airportCode: e.target.value}})}
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
                onChange={e => setFormData({...formData, destination: {...formData.destination, airportCode: e.target.value}})}
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
            
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="delayed">Delayed</option>
              </select>
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