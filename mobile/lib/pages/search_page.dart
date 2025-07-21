import 'package:flutter/material.dart';
import 'dart:async';
import '../services/location_service.dart';
import '../services/auth_service.dart';
import '../services/flight_service.dart';
import '../services/pexels_service.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  final LocationService _locationService = LocationService();
  final FlightService _flightService = FlightService();
  final AuthService _authService = AuthService();
  late PexelsService _pexelsService;
  
  List<LocationResult> _searchResults = [];
  List<LocationResult> _popularDestinations = [];
  List<PexelsPhoto> _locationPhotos = [];
  bool _isSearching = false;
  bool _isLoadingPhotos = false;
  Timer? _debounceTimer;
  String _currentSearchLocation = '';
  
  // Stats
  int _flightCount = 0;
  int _countriesCount = 0;
  int _milesFlown = 0;

  @override
  void initState() {
    super.initState();
    _initServices();
    _loadPopularDestinations();
    _loadUserStats();
  }

  Future<void> _initServices() async {
    _pexelsService = await PexelsService.create();
  }

  void _loadPopularDestinations() {
    setState(() {
      _popularDestinations = _locationService.getPopularDestinations();
    });
  }

  Future<void> _loadUserStats() async {
    try {
      // Get flight stats
      final stats = await _flightService.getFlightStats();
      
      setState(() {
        _flightCount = stats['totalFlights'] ?? 0;
        _milesFlown = stats['totalMiles'] ?? 0;
        _countriesCount = _authService.user?.countriesVisited?.length ?? 0;
      });
    } catch (e) {
      // Ignore errors for stats
    }
  }

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounceTimer?.cancel();
    
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _locationPhotos = [];
        _isSearching = false;
        _currentSearchLocation = '';
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    // Debounce search
    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      final results = await _locationService.searchLocations(query);
      if (mounted) {
        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
        
        // Load photos for the search query
        if (query.isNotEmpty && query != _currentSearchLocation) {
          _loadLocationPhotos(query);
        }
      }
    });
  }

  Future<void> _loadLocationPhotos(String location) async {
    if (_currentSearchLocation == location) return;
    
    setState(() {
      _isLoadingPhotos = true;
      _currentSearchLocation = location;
    });

    final photos = await _pexelsService.searchLocationPhotos(location, perPage: 6);
    
    if (mounted && _currentSearchLocation == location) {
      setState(() {
        _locationPhotos = photos;
        _isLoadingPhotos = false;
      });
    }
  }

  void _onLocationTap(LocationResult location) {
    // Unfocus any text field to dismiss keyboard
    FocusScope.of(context).unfocus();
    
    // Load photos for the selected location
    _loadLocationPhotos(location.name);
    
   
  }

  @override
  Widget build(BuildContext context) {
    final user = _authService.user;
    
    return GestureDetector(
      onTap: () {
        // Dismiss keyboard when tapping outside
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        body: SafeArea(
          child: Column(
          children: [
            // Header with user info
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                children: [
                  // User Profile Section
                  Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Theme.of(context).primaryColor.withAlpha(25),
                        ),
                        child: user?.avatar != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(25),
                                child: Image.network(
                                  user!.avatar!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Center(
                                      child: Text(
                                        user.username[0].toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Theme.of(context).primaryColor,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              )
                            : Center(
                                child: Text(
                                  user?.username[0].toUpperCase() ?? 'U',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).primaryColor,
                                  ),
                                ),
                              ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.username ?? 'User',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              user?.fullName ?? '',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 12),
                        Icon(Icons.location_on, color: Colors.grey[600], size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            decoration: const InputDecoration(
                              hintText: 'Search places...',
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(vertical: 12),
                            ),
                            onChanged: _onSearchChanged,
                            onSubmitted: (value) {
                              // Dismiss keyboard on submit
                              FocusScope.of(context).unfocus();
                            },
                          ),
                        ),
                        if (_isSearching)
                          const Padding(
                            padding: EdgeInsets.only(right: 12),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Location Photos
                    if (_locationPhotos.isNotEmpty) ...[
                      Text(
                        'Explore $_currentSearchLocation',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _locationPhotos.length,
                          itemBuilder: (context, index) {
                            final photo = _locationPhotos[index];
                            return Container(
                              width: 300,
                              margin: const EdgeInsets.only(right: 12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(25),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    Image.network(
                                      photo.src.medium,
                                      fit: BoxFit.cover,
                                      loadingBuilder: (context, child, loadingProgress) {
                                        if (loadingProgress == null) return child;
                                        return Container(
                                          color: Colors.grey[200],
                                          child: const Center(
                                            child: CircularProgressIndicator(),
                                          ),
                                        );
                                      },
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          color: Colors.grey[200],
                                          child: const Icon(Icons.image, size: 50),
                                        );
                                      },
                                    ),
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            begin: Alignment.bottomCenter,
                                            end: Alignment.topCenter,
                                            colors: [
                                              Colors.black.withAlpha(180),
                                              Colors.transparent,
                                            ],
                                          ),
                                        ),
                                        child: Text(
                                          'Photo by ${photo.photographer}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ] else if (_isLoadingPhotos) ...[
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: CircularProgressIndicator(),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    
                    // Search Results
                    if (_searchController.text.isNotEmpty && _searchResults.isNotEmpty) ...[
                      const Text(
                        'Search Results',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ..._searchResults.map((result) => _buildLocationCard(result)),
                      const SizedBox(height: 24),
                    ],
                    
                    // Popular Destinations
                    Row(
                      children: [
                        const Text(
                          '🔥 Popular Destinations',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ..._popularDestinations.map((destination) => _buildLocationCard(destination)),
                    
                    const SizedBox(height: 24),
                    
                    // Travel Stats
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withAlpha(25),
                            spreadRadius: 1,
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Your Travel Stats',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildStatItem(_countriesCount.toString(), 'Countries'),
                              _buildStatItem(_flightCount.toString(), 'Flights'),
                              _buildStatItem(
                                _milesFlown > 1000 
                                    ? '${(_milesFlown / 1000).toStringAsFixed(0)}k' 
                                    : _milesFlown.toString(),
                                'Miles',
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
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

  Widget _buildLocationCard(LocationResult location) {
    return GestureDetector(
      onTap: () => _onLocationTap(location),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      location.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    if (location.description.isNotEmpty)
                      Text(
                        location.description,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.grey[400],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }
}