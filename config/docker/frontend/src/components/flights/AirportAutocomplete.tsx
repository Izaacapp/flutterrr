import React, { useState, useRef, useEffect } from 'react';
import airportsData from '../../data/airports.json';

interface Airport {
  code: string;
  name: string;
  city: string;
  country?: string;
  state?: string;
  statename?: string;
  lat?: number;
  lng?: number;
}

interface AirportAutocompleteProps {
  label: string;
  value: string;
  onChange: (airport: Airport) => void;
  placeholder?: string;
  required?: boolean;
}

const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Enter airport code or city',
  required = false
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      // Find airport in local data
      const airport = (airportsData as Airport[]).find(a => a.code === value);
      if (airport) {
        setQuery(`${airport.code} - ${airport.city}`);
      } else {
        setQuery(value);
      }
    } else {
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAirports = (searchQuery: string): Airport[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const airports = airportsData as Airport[];
    
    // Search by code, name, or city
    const results = airports.filter(airport => 
      airport.code.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query)
    );
    
    // Sort by relevance (code matches first, then city, then name)
    return results.sort((a, b) => {
      const aCodeMatch = a.code.toLowerCase().startsWith(query);
      const bCodeMatch = b.code.toLowerCase().startsWith(query);
      if (aCodeMatch && !bCodeMatch) return -1;
      if (!aCodeMatch && bCodeMatch) return 1;
      
      const aCityMatch = a.city.toLowerCase().startsWith(query);
      const bCityMatch = b.city.toLowerCase().startsWith(query);
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;
      
      return 0;
    }).slice(0, 10);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      const searchResults = searchAirports(value);
      setResults(searchResults);
      setActiveIndex(0);
      setShowSuggestions(searchResults.length > 0);
    } else {
      setResults([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[activeIndex]) {
          selectAirport(results[activeIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const selectAirport = (airport: Airport) => {
    setQuery(`${airport.code} - ${airport.city}`);
    onChange({
      code: airport.code,
      name: airport.name,
      city: airport.city,
      country: airport.country || (airport.state ? 'USA' : '')
    });
    setShowSuggestions(false);
    setResults([]);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <strong key={index}>{part}</strong> : part
    );
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(results.length > 0)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
        required={required}
      />
      
      {showSuggestions && results.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {results.map((airport, index) => (
            <div
              key={airport.code}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === activeIndex ? 'bg-gray-100' : ''
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectAirport(airport)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-purple-600">
                    {highlightMatch(airport.code, query)}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {highlightMatch(airport.name, query)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {highlightMatch(`${airport.city}${airport.state ? `, ${airport.state}` : ''}${airport.country ? `, ${airport.country}` : ''}`, query)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;