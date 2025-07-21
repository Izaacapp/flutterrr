import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/flight_model.dart';
import '../services/flight_service.dart';

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
  TimeOfDay? _departureTime;
  DateTime? _arrivalDate;
  TimeOfDay? _arrivalTime;
  
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

  Future<void> _selectDate(BuildContext context, bool isDeparture) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      setState(() {
        if (isDeparture) {
          _departureDate = picked;
        } else {
          _arrivalDate = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isDeparture) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    
    if (picked != null) {
      setState(() {
        if (isDeparture) {
          _departureTime = picked;
        } else {
          _arrivalTime = picked;
        }
      });
    }
  }

  DateTime? _combineDateAndTime(DateTime? date, TimeOfDay? time) {
    if (date == null || time == null) return null;
    return DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    final departureDateTime = _combineDateAndTime(_departureDate, _departureTime);
    final arrivalDateTime = _combineDateAndTime(_arrivalDate, _arrivalTime);
    
    if (departureDateTime == null || arrivalDateTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select departure and arrival times')),
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
        'scheduledDepartureTime': departureDateTime.toIso8601String(),
        'scheduledArrivalTime': arrivalDateTime.toIso8601String(),
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
                  
                  // Origin Section
                  const Text(
                    'Origin',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      SizedBox(
                        width: 100,
                        child: TextFormField(
                          controller: _originAirportController,
                          decoration: const InputDecoration(
                            labelText: 'Airport',
                            border: OutlineInputBorder(),
                          ),
                          textCapitalization: TextCapitalization.characters,
                          maxLength: 3,
                          validator: (value) {
                            if (value == null || value.length != 3) {
                              return '3 letters';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _originCityController,
                          decoration: const InputDecoration(
                            labelText: 'City',
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
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _originCountryController,
                    decoration: const InputDecoration(
                      labelText: 'Country',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Destination Section
                  const Text(
                    'Destination',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      SizedBox(
                        width: 100,
                        child: TextFormField(
                          controller: _destAirportController,
                          decoration: const InputDecoration(
                            labelText: 'Airport',
                            border: OutlineInputBorder(),
                          ),
                          textCapitalization: TextCapitalization.characters,
                          maxLength: 3,
                          validator: (value) {
                            if (value == null || value.length != 3) {
                              return '3 letters';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _destCityController,
                          decoration: const InputDecoration(
                            labelText: 'City',
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
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _destCountryController,
                    decoration: const InputDecoration(
                      labelText: 'Country',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      return null;
                    },
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
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => _selectDate(context, true),
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Departure Date',
                              border: OutlineInputBorder(),
                            ),
                            child: Text(
                              _departureDate != null
                                  ? DateFormat('MMM dd, yyyy').format(_departureDate!)
                                  : 'Select date',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: InkWell(
                          onTap: () => _selectTime(context, true),
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Departure Time',
                              border: OutlineInputBorder(),
                            ),
                            child: Text(
                              _departureTime != null
                                  ? _departureTime!.format(context)
                                  : 'Select time',
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => _selectDate(context, false),
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Arrival Date',
                              border: OutlineInputBorder(),
                            ),
                            child: Text(
                              _arrivalDate != null
                                  ? DateFormat('MMM dd, yyyy').format(_arrivalDate!)
                                  : 'Select date',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: InkWell(
                          onTap: () => _selectTime(context, false),
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Arrival Time',
                              border: OutlineInputBorder(),
                            ),
                            child: Text(
                              _arrivalTime != null
                                  ? _arrivalTime!.format(context)
                                  : 'Select time',
                            ),
                          ),
                        ),
                      ),
                    ],
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