import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/flight_service.dart';
import '../models/flight_model.dart';
import '../widgets/flight_card.dart';
import '../widgets/flight_form.dart';
import '../widgets/flight_edit_form.dart';

class FlightsPage extends StatefulWidget {
  const FlightsPage({super.key});

  @override
  State<FlightsPage> createState() => _FlightsPageState();
}

class _FlightsPageState extends State<FlightsPage> with TickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _fabAnimationController;
  final FlightService _flightService = FlightService();
  final ImagePicker _imagePicker = ImagePicker();
  
  List<Flight> _upcomingFlights = [];
  List<Flight> _completedFlights = [];
  bool _isLoading = true;
  String? _error;
  bool _isFabOpen = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fabAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _loadFlights();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fabAnimationController.dispose();
    super.dispose();
  }

  Future<void> _loadFlights() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final flights = await _flightService.getMyFlights();
      
      setState(() {
        _upcomingFlights = flights.where((f) => f.isUpcoming || f.isDelayed).toList();
        _completedFlights = flights.where((f) => f.isCompleted).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _showAddFlightDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FlightForm(
        onFlightAdded: (flight) {
          Navigator.pop(context);
          _loadFlights();
        },
      ),
    );
  }

  Future<void> _uploadBoardingPass(ImageSource source) async {
    try {
      final XFile? image = await _imagePicker.pickImage(source: source);
      if (image == null) return;

      setState(() {
        _isLoading = true;
      });

      final file = File(image.path);
      final flight = await _flightService.uploadBoardingPass(file);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Boarding pass uploaded successfully!')),
        );
        
        _loadFlights();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  void _toggleFab() {
    setState(() {
      _isFabOpen = !_isFabOpen;
    });
    if (_isFabOpen) {
      _fabAnimationController.forward();
    } else {
      _fabAnimationController.reverse();
    }
  }

  void _showEditFlightDialog(Flight flight) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FlightEditForm(
        flight: flight,
        onFlightUpdated: (updatedFlight) {
          Navigator.pop(context);
          _loadFlights();
        },
      ),
    );
  }

  Future<void> _deleteFlight(Flight flight) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Flight'),
        content: Text('Are you sure you want to delete flight ${flight.airline} ${flight.flightNumber}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _flightService.deleteFlight(flight.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Flight deleted successfully')),
          );
          _loadFlights();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting flight: ${e.toString()}')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Flights'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFlightsList(_upcomingFlights, true),
          _buildFlightsList(_completedFlights, false),
        ],
      ),
      floatingActionButton: _buildFABMenu(),
    );
  }

  Widget _buildFlightsList(List<Flight> flights, bool isUpcoming) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading flights',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(_error!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFlights,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (flights.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isUpcoming ? Icons.event_available : Icons.flight_takeoff,
              size: 80,
              color: Colors.grey,
            ),
            const SizedBox(height: 24),
            Text(
              isUpcoming ? 'No Upcoming Flights' : 'No Flight History',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isUpcoming 
                ? 'Add your upcoming flights to track them'
                : 'Your completed flights will appear here',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadFlights,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: flights.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: FlightCard(
              flight: flights[index],
              onTap: () {
                // TODO: Navigate to flight details
              },
              onEdit: () => _showEditFlightDialog(flights[index]),
              onDelete: () => _deleteFlight(flights[index]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFABMenu() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (_isFabOpen) ...[
          // Manual Entry Option
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Manual Entry',
                  style: TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              FloatingActionButton.small(
                heroTag: 'manual',
                onPressed: () {
                  _toggleFab();
                  _showAddFlightDialog();
                },
                child: const Icon(Icons.edit),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Camera Option
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Take Photo',
                  style: TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              FloatingActionButton.small(
                heroTag: 'camera',
                onPressed: () {
                  _toggleFab();
                  _uploadBoardingPass(ImageSource.camera);
                },
                child: const Icon(Icons.camera_alt),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Gallery Option
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Upload from Gallery',
                  style: TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              FloatingActionButton.small(
                heroTag: 'gallery',
                onPressed: () {
                  _toggleFab();
                  _uploadBoardingPass(ImageSource.gallery);
                },
                child: const Icon(Icons.photo_library),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
        // Main FAB
        FloatingActionButton(
          onPressed: _toggleFab,
          child: AnimatedBuilder(
            animation: _fabAnimationController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _fabAnimationController.value * 0.785398, // 45 degrees
                child: Icon(_isFabOpen ? Icons.close : Icons.add),
              );
            },
          ),
        ),
      ],
    );
  }
}