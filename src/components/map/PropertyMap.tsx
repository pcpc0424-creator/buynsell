'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMapEvents } from 'react-leaflet';
// Leaflet types are provided by react-leaflet

// Dynamic import to avoid SSR issues
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

const PropertyMarker = dynamic(() => import('./PropertyMarker'), { ssr: false });

interface Property {
  id: string;
  title: string;
  price: number;
  mainImage: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
}

interface PropertyMapProps {
  properties: Property[];
  selectedPropertyId?: string | null;
  onPropertySelect?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
  showCluster?: boolean;
}

// Component to track map bounds changes
function BoundsTracker({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });

  return null;
}

export default function PropertyMap({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onBoundsChange,
  className = 'h-[600px] w-full',
}: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter properties with valid coordinates
  const validProperties = useMemo(() => {
    return properties.filter(
      (p) => p.latitude !== null && p.longitude !== null
    ) as (Property & { latitude: number; longitude: number })[];
  }, [properties]);

  // Calculate map center based on properties
  const mapCenter = useMemo((): [number, number] => {
    if (validProperties.length === 0) {
      // Default: Manila, Philippines
      return [14.5995, 120.9842];
    }

    // If there's a selected property, center on it
    if (selectedPropertyId) {
      const selected = validProperties.find((p) => p.id === selectedPropertyId);
      if (selected) {
        return [selected.latitude, selected.longitude];
      }
    }

    // Otherwise, center on the average of all properties
    const avgLat =
      validProperties.reduce((sum, p) => sum + p.latitude, 0) / validProperties.length;
    const avgLng =
      validProperties.reduce((sum, p) => sum + p.longitude, 0) / validProperties.length;

    return [avgLat, avgLng];
  }, [validProperties, selectedPropertyId]);

  // Calculate appropriate zoom level
  const mapZoom = useMemo(() => {
    if (validProperties.length <= 1) return 14;
    if (validProperties.length <= 5) return 13;
    if (validProperties.length <= 20) return 12;
    return 11;
  }, [validProperties.length]);

  const handlePropertySelect = useCallback(
    (id: string) => {
      onPropertySelect?.(id);
    },
    [onPropertySelect]
  );

  if (!mounted) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-500">Loading map...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Map center={mapCenter} zoom={mapZoom} className="h-full w-full rounded-lg">
        <BoundsTracker onBoundsChange={onBoundsChange} />
        {validProperties.map((property) => (
          <PropertyMarker
            key={property.id}
            property={property}
            isSelected={property.id === selectedPropertyId}
            onSelect={handlePropertySelect}
          />
        ))}
      </Map>
    </div>
  );
}
