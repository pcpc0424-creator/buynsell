'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

// Custom marker for single property view
const propertyIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="relative">
      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-3 h-3 bg-blue-600 rotate-45"></div>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -45],
});

interface SinglePropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
  title?: string;
  className?: string;
  zoom?: number;
  interactive?: boolean;
}

export default function SinglePropertyMap({
  latitude,
  longitude,
  address,
  title,
  className = 'h-[300px] w-full',
  zoom = 15,
  interactive = true,
}: SinglePropertyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-500">Loading map...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Map
        center={[latitude, longitude]}
        zoom={zoom}
        className="h-full w-full rounded-lg"
        scrollWheelZoom={interactive}
        dragging={interactive}
      >
        <Marker position={[latitude, longitude]} icon={propertyIcon}>
          <Popup>
            <div className="p-2">
              {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
              <p className="text-gray-600 text-sm">{address}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline mt-2 inline-block"
              >
                Get Directions
              </a>
            </div>
          </Popup>
        </Marker>
      </Map>
    </div>
  );
}
