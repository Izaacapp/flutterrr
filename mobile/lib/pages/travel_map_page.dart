import 'package:flutter/material.dart';

class TravelMapPage extends StatelessWidget {
  const TravelMapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Travel Map'),
        centerTitle: true,
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.public,
                size: 80,
                color: Colors.grey,
              ),
              SizedBox(height: 24),
              Text(
                'Travel Map',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 16),
              Text(
                'Visualize your travel history, explore new destinations, and plan your next adventure.',
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
                      Text('🗺️ View interactive world map'),
                      SizedBox(height: 8),
                      Text('📍 Mark visited countries'),
                      SizedBox(height: 8),
                      Text('🎯 Set travel goals'),
                      SizedBox(height: 8),
                      Text('📊 Track travel statistics'),
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