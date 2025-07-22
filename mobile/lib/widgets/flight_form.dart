import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/flight_model.dart';
import '../models/airport_model.dart';
import '../services/flight_service.dart';
import 'airport_autocomplete.dart';

class FlightForm extends StatefulWidget {
  final Function(Flight) onFlightAdded;

  const FlightForm({
    super.key,
    required this.onFlightAdded,
  });

  @override
  State<FlightForm> createState() => _FlightFormState();
}

class _FlightFormState extends State<FlightForm> {
  final _formKey = GlobalKey<FormState>();
  final FlightService _flightService = FlightService();
  
  // Form controllers
  final _airlineController = TextEditingController();
  final _flightNumberController = TextEditingController();
  final _confirmationCodeController = TextEditingController();
  final _originAirportController = TextEditingController();
  final _originCityController = TextEditingController();
  final _originCountryController = TextEditingController();
  final _destAirportController = TextEditingController();
  final _destCityController = TextEditingController();
  final _destCountryController = TextEditingController();
  final _seatNumberController = TextEditingController();
  
  DateTime? _departureDate;
  
  String _selectedAirline = 'Other';
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
  void dispose() {
    _airlineController.dispose();
    _flightNumberController.dispose();
    _confirmationCodeController.dispose();
    _originAirportController.dispose();
    _originCityController.dispose();
    _originCountryController.dispose();
    _destAirportController.dispose();
    _destCityController.dispose();
    _destCountryController.dispose();
    _seatNumberController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      setState(() {
        _departureDate = picked;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_departureDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select flight date')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final flightData = {
        'airline': _selectedAirline,
        'flightNumber': _flightNumberController.text,
        'confirmationCode': _confirmationCodeController.text,
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
        'scheduledDepartureTime': _departureDate!.toIso8601String(),
        'seatNumber': _seatNumberController.text.isEmpty ? null : _seatNumberController.text,
      };

      final flight = await _flightService.createFlight(flightData);
      if (mounted) {
        widget.onFlightAdded(flight);
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
                  'Add Flight',
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
                  
                  // Flight Number and Confirmation Code
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _flightNumberController,
                          decoration: const InputDecoration(
                            labelText: 'Flight Number',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _confirmationCodeController,
                          decoration: const InputDecoration(
                            labelText: 'Confirmation Code',
                            border: OutlineInputBorder(),
                          ),
                          textCapitalization: TextCapitalization.characters,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
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
                  
                  // Date and Time Section
                  const Text(
                    'Schedule',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => _selectDate(context),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Flight Date *',
                        border: OutlineInputBorder(),
                        suffixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        _departureDate != null
                            ? DateFormat('MMM dd, yyyy').format(_departureDate!)
                            : 'Select date',
                        style: TextStyle(
                          color: _departureDate != null ? Colors.black87 : Colors.grey[600],
                        ),
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
                            'Add Flight',
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