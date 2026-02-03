'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/lib/config';

// Custom marker icon for properties
const createPropertyIcon = (price: string, isSelected: boolean = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="px-2 py-1 rounded-lg shadow-lg text-xs font-bold whitespace-nowrap
          ${isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 border border-gray-200'
          }">
          ${price}
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45
          ${isSelected ? 'bg-blue-600' : 'bg-white border-r border-b border-gray-200'}
        "></div>
      </div>
    `,
    iconSize: [80, 40],
    iconAnchor: [40, 40],
    popupAnchor: [0, -35],
  });
};

interface Property {
  id: string;
  title: string;
  price: number;
  mainImage: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
}

interface PropertyMarkerProps {
  property: Property;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export default function PropertyMarker({
  property,
  isSelected = false,
  onSelect,
}: PropertyMarkerProps) {
  const formatPrice = (price: number, type: string) => {
    if (price >= 1000000) {
      return `₱${(price / 1000000).toFixed(1)}M${type === 'RENT' ? '/mo' : ''}`;
    } else if (price >= 1000) {
      return `₱${(price / 1000).toFixed(0)}K${type === 'RENT' ? '/mo' : ''}`;
    }
    return `₱${price.toLocaleString()}${type === 'RENT' ? '/mo' : ''}`;
  };

  const priceLabel = formatPrice(property.price, property.transactionType);
  const icon = createPropertyIcon(priceLabel, isSelected);

  return (
    <Marker
      position={[property.latitude, property.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect?.(property.id),
      }}
    >
      <Popup>
        <div className="w-64 p-0">
          <Link href={`/properties/${property.propertyType.toLowerCase()}/${property.id}`}>
            <div className="relative h-32 w-full">
              <Image
                src={property.mainImage || `${config.basePath}/images/placeholder-property.svg`}
                alt={property.title}
                fill
                className="object-cover rounded-t-lg"
              />
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  property.transactionType === 'RENT'
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {property.transactionType === 'RENT' ? 'For Rent' : 'For Sale'}
                </span>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
              <p className="text-blue-600 font-bold text-lg">
                ₱{property.price.toLocaleString()}
                {property.transactionType === 'RENT' && <span className="text-sm font-normal">/month</span>}
              </p>
              <p className="text-gray-500 text-sm truncate">{property.address}, {property.city}</p>
              <div className="flex gap-3 mt-2 text-sm text-gray-600">
                {property.bedrooms && <span>{property.bedrooms} beds</span>}
                {property.bathrooms && <span>{property.bathrooms} baths</span>}
                {property.area && <span>{property.area} sqm</span>}
              </div>
            </div>
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
