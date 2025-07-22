import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/flight_model.dart';
import '../services/flight_service.dart';

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
  late TextEditingController _confirmationCodeController;
  late TextEditingController _originAirportController;
  late TextEditingController _originCityController;
  late TextEditingController _originCountryController;
  late TextEditingController _destAirportController;
  late TextEditingController _destCityController;
  late TextEditingController _destCountryController;
  late TextEditingController _seatNumberController;
  
  late DateTime _departureDate;
  late TimeOfDay _departureTime;
  late DateTime _arrivalDate;
  late TimeOfDay _arrivalTime;
  
  late String _selectedAirline;
  late String _selectedStatus;
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

  final List<String> _statuses = [
    'upcoming',
    'completed',
    'cancelled',
    'delayed',
  ];

  @override
  void initState() {
    super.initState();
    // Initialize controllers with existing flight data
    _airlineController = TextEditingController(text: widget.flight.airline);
    _flightNumberController = TextEditingController(text: widget.flight.flightNumber);
    _confirmationCodeController = TextEditingController(text: widget.flight.confirmationCode);
    _originAirportController = TextEditingController(text: widget.flight.origin.airportCode);
    _originCityController = TextEditingController(text: widget.flight.origin.city);
    _originCountryController = TextEditingController(text: widget.flight.origin.country);
    _destAirportController = TextEditingController(text: widget.flight.destination.airportCode);
    _destCityController = TextEditingController(text: widget.flight.destination.city);
    _destCountryController = TextEditingController(text: widget.flight.destination.country);
    _seatNumberController = TextEditingController(text: widget.flight.seatNumber ?? '');
    
    // Initialize date/time
    _departureDate = widget.flight.scheduledDepartureTime;
    _departureTime = TimeOfDay.fromDateTime(widget.flight.scheduledDepartureTime);
    _arrivalDate = widget.flight.scheduledArrivalTime;
    _arrivalTime = TimeOfDay.fromDateTime(widget.flight.scheduledArrivalTime);
    
    _selectedAirline = widget.flight.airline;
    _selectedStatus = widget.flight.status;
  }

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
      initialDate: isDeparture ? _departureDate : _arrivalDate,
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
      initialTime: isDeparture ? _departureTime : _arrivalTime,
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

  DateTime _combineDateAndTime(DateTime date, TimeOfDay time) {
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

    setState(() {
      _isLoading = true;
    });

    try {
      final updates = {
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
        'scheduledDepartureTime': _combineDateAndTime(_departureDate, _departureTime).toIso8601String(),
        'scheduledArrivalTime': _combineDateAndTime(_arrivalDate, _arrivalTime).toIso8601String(),
        'seatNumber': _seatNumberController.text.isEmpty ? null : _seatNumberController.text,
        'status': _selectedStatus,
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
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Status Selection
                  DropdownButtonFormField<String>(
                    value: _selectedStatus,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                    ),
                    items: _statuses.map((status) {
                      return DropdownMenuItem(
                        value: status,
                        child: Text(status[0].toUpperCase() + status.substring(1)),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedStatus = value!;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  
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
                              DateFormat('MMM dd, yyyy').format(_departureDate),
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
                              _departureTime.format(context),
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
                              DateFormat('MMM dd, yyyy').format(_arrivalDate),
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
                              _arrivalTime.format(context),
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