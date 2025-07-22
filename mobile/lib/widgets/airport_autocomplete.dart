import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/airport_model.dart';

class AirportAutocomplete extends StatefulWidget {
  final String label;
  final String? value;
  final Function(Airport) onChanged;
  final String placeholder;
  final bool required;

  const AirportAutocomplete({
    super.key,
    required this.label,
    this.value,
    required this.onChanged,
    this.placeholder = 'Enter airport code or city',
    this.required = false,
  });

  @override
  State<AirportAutocomplete> createState() => _AirportAutocompleteState();
}

class _AirportAutocompleteState extends State<AirportAutocomplete> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  List<Airport> _airports = [];
  List<Airport> _filteredAirports = [];
  int _selectedIndex = 0;
  OverlayEntry? _overlayEntry;

  @override
  void initState() {
    super.initState();
    _loadAirports();
    _controller.addListener(_onSearchChanged);
    _focusNode.addListener(_onFocusChanged);
    
    // Set initial value if provided
    if (widget.value != null && widget.value!.isNotEmpty) {
      _controller.text = widget.value!;
    }
  }

  @override
  void didUpdateWidget(AirportAutocomplete oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value && widget.value != null) {
      final airport = _airports.firstWhere(
        (a) => a.code == widget.value,
        orElse: () => Airport(code: widget.value!, name: '', city: widget.value!),
      );
      _controller.text = airport.displayName;
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_onSearchChanged);
    _controller.dispose();
    _focusNode.removeListener(_onFocusChanged);
    _focusNode.dispose();
    _removeOverlay();
    super.dispose();
  }

  Future<void> _loadAirports() async {
    try {
      final String jsonString = await rootBundle.loadString('assets/data/airports.json');
      final List<dynamic> jsonData = json.decode(jsonString);
      setState(() {
        _airports = jsonData.map((data) => Airport.fromJson(data)).toList();
      });
    } catch (e) {
      debugPrint('Error loading airports: $e');
    }
  }

  void _onSearchChanged() {
    final query = _controller.text.toLowerCase();
    
    if (query.length < 2) {
      _removeOverlay();
      return;
    }

    final filtered = _airports.where((airport) {
      return airport.code.toLowerCase().contains(query) ||
             airport.name.toLowerCase().contains(query) ||
             airport.city.toLowerCase().contains(query);
    }).toList();

    // Sort by relevance
    filtered.sort((a, b) {
      final aCodeMatch = a.code.toLowerCase().startsWith(query);
      final bCodeMatch = b.code.toLowerCase().startsWith(query);
      if (aCodeMatch && !bCodeMatch) return -1;
      if (!aCodeMatch && bCodeMatch) return 1;
      
      final aCityMatch = a.city.toLowerCase().startsWith(query);
      final bCityMatch = b.city.toLowerCase().startsWith(query);
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;
      
      return 0;
    });

    setState(() {
      _filteredAirports = filtered.take(10).toList();
      _selectedIndex = 0;
    });

    if (_filteredAirports.isNotEmpty && _focusNode.hasFocus) {
      _showOverlay();
    } else {
      _removeOverlay();
    }
  }

  void _onFocusChanged() {
    if (!_focusNode.hasFocus) {
      // Delay to allow tap on suggestion
      Future.delayed(const Duration(milliseconds: 200), () {
        _removeOverlay();
      });
    }
  }

  void _selectAirport(Airport airport) {
    _controller.text = airport.displayName;
    widget.onChanged(airport);
    _removeOverlay();
    _focusNode.unfocus();
  }

  void _showOverlay() {
    _removeOverlay();
    
    final overlay = Overlay.of(context);
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;
    final offset = renderBox.localToGlobal(Offset.zero);

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        left: offset.dx,
        top: offset.dy + size.height + 5,
        width: size.width,
        child: Material(
          elevation: 4,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 200),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: ListView.builder(
              padding: EdgeInsets.zero,
              shrinkWrap: true,
              itemCount: _filteredAirports.length,
              itemBuilder: (context, index) {
                final airport = _filteredAirports[index];
                final isSelected = index == _selectedIndex;
                
                return InkWell(
                  onTap: () => _selectAirport(airport),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    color: isSelected ? Colors.grey.shade100 : null,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              airport.code,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                airport.name,
                                style: const TextStyle(fontSize: 14),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          airport.fullLocation,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );

    overlay.insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              widget.label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (widget.required)
              const Text(
                ' *',
                style: TextStyle(color: Colors.red),
              ),
          ],
        ),
        const SizedBox(height: 8),
        KeyboardListener(
          focusNode: FocusNode(),
          onKeyEvent: (KeyEvent event) {
            if (event is KeyDownEvent) {
              if (event.logicalKey == LogicalKeyboardKey.arrowDown) {
                setState(() {
                  if (_filteredAirports.isNotEmpty) {
                    _selectedIndex = (_selectedIndex + 1) % _filteredAirports.length;
                  }
                });
                _showOverlay();
              } else if (event.logicalKey == LogicalKeyboardKey.arrowUp) {
                setState(() {
                  if (_filteredAirports.isNotEmpty) {
                    _selectedIndex = (_selectedIndex - 1 + _filteredAirports.length) % _filteredAirports.length;
                  }
                });
                _showOverlay();
              } else if (event.logicalKey == LogicalKeyboardKey.enter) {
                if (_filteredAirports.isNotEmpty) {
                  _selectAirport(_filteredAirports[_selectedIndex]);
                }
              } else if (event.logicalKey == LogicalKeyboardKey.escape) {
                _removeOverlay();
              }
            }
          },
          child: TextFormField(
            controller: _controller,
            focusNode: _focusNode,
            decoration: InputDecoration(
              hintText: widget.placeholder,
              prefixIcon: const Icon(Icons.flight_takeoff),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: widget.required
                ? (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please select an airport';
                    }
                    // Check if it's a valid airport code format
                    if (!_airports.any((a) => a.displayName == value)) {
                      return 'Please select a valid airport';
                    }
                    return null;
                  }
                : null,
          ),
        ),
      ],
    );
  }
}