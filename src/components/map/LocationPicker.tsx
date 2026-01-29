'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Loader2 } from 'lucide-react';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

// Custom draggable marker icon
const pickerIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="relative animate-bounce">
      <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-red-500 rotate-45 border-r border-b border-white"></div>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

// Component to handle map clicks
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationChange,
  className = 'h-[400px] w-full',
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(
    initialLatitude && initialLongitude
      ? [initialLatitude, initialLongitude]
      : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        const data = await response.json();
        return data.display_name;
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return undefined;
      }
    },
    []
  );

  // Handle location selection
  const handleLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      setPosition([lat, lng]);
      const address = await reverseGeocode(lat, lng);
      onLocationChange(lat, lng, address);
    },
    [onLocationChange, reverseGeocode]
  );

  // Search for location
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setShowResults(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Philippines'
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Select a search result
  const handleResultSelect = useCallback(
    (result: any) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      setPosition([lat, lng]);
      onLocationChange(lat, lng, result.display_name);
      setShowResults(false);
      setSearchQuery(result.display_name);
    },
    [onLocationChange]
  );

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        const address = await reverseGeocode(latitude, longitude);
        onLocationChange(latitude, longitude, address);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please select manually on the map.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationChange, reverseGeocode]);

  if (!mounted) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-500">Loading map...</span>
      </div>
    );
  }

  const mapCenter: [number, number] = position || [14.5995, 120.9842]; // Default: Manila

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gettingLocation}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            title="Use my location"
          >
            {gettingLocation ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleResultSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <p className="text-sm text-gray-900 truncate">{result.display_name}</p>
                <p className="text-xs text-gray-500 mt-1">{result.type}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className={className}>
        <Map center={mapCenter} zoom={position ? 16 : 12} className="h-full w-full rounded-lg">
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {position && (
            <Marker
              position={position}
              icon={pickerIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  handleLocationSelect(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </Map>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-500">
        Click on the map to select a location, or search for an address. You can also drag the marker to adjust.
      </p>

      {/* Selected Coordinates */}
      {position && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selected:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}
    </div>
  );
}
