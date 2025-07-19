import 'package:flutter/material.dart';

class FlightsPage extends StatelessWidget {
  const FlightsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Flights'),
        centerTitle: true,
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.airplanemode_active,
                size: 80,
                color: Colors.grey,
              ),
              SizedBox(height: 24),
              Text(
                'My Flights',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 16),
              Text(
                'View your flight history, upcoming trips, and manage your travel itinerary.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              SizedBox(height: 32),
              Card(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Text(
                        'Coming Soon!',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'This feature is under development. You\'ll be able to:',
                        style: TextStyle(color: Colors.grey),
                      ),
                      SizedBox(height: 12),
                      Text('📋 View flight history'),
                      SizedBox(height: 8),
                      Text('✈️ Manage upcoming flights'),
                      SizedBox(height: 8),
                      Text('🎫 Store boarding passes'),
                      SizedBox(height: 8),
                      Text('📊 Track flight statistics'),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}