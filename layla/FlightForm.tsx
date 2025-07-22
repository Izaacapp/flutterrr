import React, { useState } from 'react';
import AirportAutocomplete from './AirportAutocomplete';
import { flightService } from '../../services/flight.service';
import { toast } from 'react-hot-toast';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface FlightFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingFlight?: any;
}

const FlightForm: React.FC<FlightFormProps> = ({ onSuccess, onCancel, editingFlight }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    departureAirport: editingFlight?.departureAirport || '',
    departureCity: editingFlight?.departureCity || '',
    departureCountry: editingFlight?.departureCountry || '',
    arrivalAirport: editingFlight?.arrivalAirport || '',
    arrivalCity: editingFlight?.arrivalCity || '',
    arrivalCountry: editingFlight?.arrivalCountry || '',
    date: editingFlight?.date ? new Date(editingFlight.date).toISOString().split('T')[0] : '',
    notes: editingFlight?.notes || ''
  });

  const handleDepartureChange = (airport: Airport) => {
    setFormData(prev => ({
      ...prev,
      departureAirport: airport.code,
      departureCity: airport.city,
      departureCountry: airport.country
    }));
  };

  const handleArrivalChange = (airport: Airport) => {
    setFormData(prev => ({
      ...prev,
      arrivalAirport: airport.code,
      arrivalCity: airport.city,
      arrivalCountry: airport.country
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.departureAirport === formData.arrivalAirport) {
      toast.error('Departure and arrival airports cannot be the same');
      return;
    }

    setLoading(true);
    try {
      if (editingFlight) {
        await flightService.updateFlight(editingFlight._id, formData);
        toast.success('Flight updated successfully!');
      } else {
        await flightService.createFlight(formData);
        toast.success('Flight added successfully!');
      }
      
      // Reset form only if not editing
      if (!editingFlight) {
        setFormData({
          departureAirport: '',
          departureCity: '',
          departureCountry: '',
          arrivalAirport: '',
          arrivalCity: '',
          arrivalCountry: '',
          date: '',
          notes: ''
        });
      }
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${editingFlight ? 'update' : 'add'} flight`);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AirportAutocomplete
          label="Departure Airport"
          value={formData.departureAirport}
          onChange={handleDepartureChange}
          placeholder="Enter departure airport"
          required
        />
        
        <AirportAutocomplete
          label="Arrival Airport"
          value={formData.arrivalAirport}
          onChange={handleArrivalChange}
          placeholder="Enter arrival airport"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Flight Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          placeholder="Add any notes about this flight..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (editingFlight ? 'Updating...' : 'Adding...') : (editingFlight ? 'Update Flight' : 'Add Flight')}
        </button>
      </div>
    </form>
  );
};

export default FlightForm;