import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/flight_model.dart';
import '../models/airport_model.dart';
import '../services/flight_service.dart';
import 'airport_autocomplete.dart';

class FlightEditForm extends StatefulWidget {
  final Flight flight;
  final Function(Flight) onFlightUpdated;

  const FlightEditForm({
    super.key,
    required this.flight,
    required this.onFlightUpdated,
  });

  @override
  State<FlightEditForm> createState() => _FlightEditFormState();
}

class _FlightEditFormState extends State<FlightEditForm> {
  final _formKey = GlobalKey<FormState>();
  final FlightService _flightService = FlightService();
  
  // Form controllers
  late TextEditingController _airlineController;
  late TextEditingController _flightNumberController;
  late TextEditingController _originAirportController;
  late TextEditingController _originCityController;
  late TextEditingController _originCountryController;
  late TextEditingController _destAirportController;
  late TextEditingController _destCityController;
  late TextEditingController _destCountryController;
  late TextEditingController _seatNumberController;
  
  late DateTime _departureDate;
  
  late String _selectedAirline;
  bool _isLoading = false;

  final List<String> _airlines = [
    'Delta',
    'American',
    'United',
    'Southwest',
    'Spirit',
    'Frontier',
    'JetBlue',
    'Alaska',
    'Hawaiian',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    // Initialize controllers with existing flight data
    _airlineController = TextEditingController(text: widget.flight.airline);
    _flightNumberController = TextEditingController(text: widget.flight.flightNumber);
    _originAirportController = TextEditingController(text: widget.flight.origin.airportCode);
    _originCityController = TextEditingController(text: widget.flight.origin.city);
    _originCountryController = TextEditingController(text: widget.flight.origin.country);
    _destAirportController = TextEditingController(text: widget.flight.destination.airportCode);
    _destCityController = TextEditingController(text: widget.flight.destination.city);
    _destCountryController = TextEditingController(text: widget.flight.destination.country);
    _seatNumberController = TextEditingController(text: widget.flight.seatNumber ?? '');
    
    // Initialize date
    _departureDate = widget.flight.scheduledDepartureTime;
    
    _selectedAirline = widget.flight.airline;
  }

  @override
  void dispose() {
    _airlineController.dispose();
    _flightNumberController.dispose();
    _originAirportController.dispose();
    _originCityController.dispose();
    _originCountryController.dispose();
    _destAirportController.dispose();
    _destCityController.dispose();
    _destCountryController.dispose();
    _seatNumberController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isDeparture) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _departureDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null && picked != _departureDate) {
      setState(() {
        _departureDate = picked;
      });
    }
  }


  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final updates = {
        'airline': _selectedAirline,
        'flightNumber': _flightNumberController.text,
        'origin': {
          'airportCode': _originAirportController.text.toUpperCase(),
          'city': _originCityController.text,
          'country': _originCountryController.text,
        },
        'destination': {
          'airportCode': _destAirportController.text.toUpperCase(),
          'city': _destCityController.text,
          'country': _destCountryController.text,
        },
        'scheduledDepartureTime': _departureDate.toIso8601String(),
        'seatNumber': _seatNumberController.text.isEmpty ? null : _seatNumberController.text,
        'status': widget.flight.status,
      };

      final updatedFlight = await _flightService.updateFlight(widget.flight.id, updates);
      if (mounted) {
        widget.onFlightUpdated(updatedFlight);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12, bottom: 20),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Edit Flight',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.flight_takeoff, color: Colors.blue.shade700, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'One-way ticket entry - Required: Departure & Arrival airports, Date',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  
                  // Airline Selection
                  DropdownButtonFormField<String>(
                    value: _selectedAirline,
                    decoration: const InputDecoration(
                      labelText: 'Airline',
                      border: OutlineInputBorder(),
                    ),
                    items: _airlines.map((airline) {
                      return DropdownMenuItem(
                        value: airline,
                        child: Text(airline),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedAirline = value!;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  // Flight Number
                  TextFormField(
                    controller: _flightNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Flight Number (optional)',
                      border: OutlineInputBorder(),
                      hintText: 'e.g., DL123',
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Origin Airport
                  AirportAutocomplete(
                    label: 'Departure Airport',
                    value: _originAirportController.text.isNotEmpty ? _originAirportController.text : null,
                    onChanged: (airport) {
                      setState(() {
                        _originAirportController.text = airport.code;
                        _originCityController.text = airport.city;
                        _originCountryController.text = airport.country ?? '';
                      });
                    },
                    placeholder: 'Enter departure airport',
                    required: true,
                  ),
                  const SizedBox(height: 24),
                  
                  // Destination Airport
                  AirportAutocomplete(
                    label: 'Arrival Airport',
                    value: _destAirportController.text.isNotEmpty ? _destAirportController.text : null,
                    onChanged: (airport) {
                      setState(() {
                        _destAirportController.text = airport.code;
                        _destCityController.text = airport.city;
                        _destCountryController.text = airport.country ?? '';
                      });
                    },
                    placeholder: 'Enter arrival airport',
                    required: true,
                  ),
                  const SizedBox(height: 24),
                  
                  // Flight Date
                  InkWell(
                    onTap: () => _selectDate(context, true),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Flight Date',
                        border: OutlineInputBorder(),
                        suffixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        DateFormat('MMM dd, yyyy').format(_departureDate),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Optional: Seat Number
                  TextFormField(
                    controller: _seatNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Seat Number (Optional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Submit Button
                  ElevatedButton(
                    onPressed: _isLoading ? null : _submitForm,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text(
                            'Update Flight',
                            style: TextStyle(fontSize: 16),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}