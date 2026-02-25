'use client';

import { memo } from 'react';
import { PHILIPPINE_CITIES } from '@/lib/geocoding';

export interface FilterState {
  transactionType: string;
  propertyType: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
}

interface PropertyFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

const propertyTypes = [
  { value: '', label: 'All Types' },
  { value: 'HOUSE', label: 'House & Lot' },
  { value: 'CONDO', label: 'Condominium' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LOT', label: 'Lot' },
  { value: 'NEW_DEVELOPMENT', label: 'New Development' },
];


const priceRanges = [
  { min: '', max: '', label: 'Any Price' },
  { min: '0', max: '5000000', label: 'Under ₱5M' },
  { min: '5000000', max: '10000000', label: '₱5M - ₱10M' },
  { min: '10000000', max: '25000000', label: '₱10M - ₱25M' },
  { min: '25000000', max: '50000000', label: '₱25M - ₱50M' },
  { min: '50000000', max: '', label: '₱50M+' },
];

function PropertyFilters({ filters, onFilterChange, onReset }: PropertyFiltersProps) {
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handlePriceRangeChange = (min: string, max: string) => {
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="glass-ultra rounded-2xl p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-accent-blue text-sm hover:underline"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Transaction Type */}
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-2">
            Transaction Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleChange('transactionType', '')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filters.transactionType === ''
                  ? 'btn-premium text-white'
                  : 'glass-ultra text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleChange('transactionType', 'SALE')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filters.transactionType === 'SALE'
                  ? 'btn-premium text-white'
                  : 'glass-ultra text-slate-500 hover:text-slate-800'
              }`}
            >
              Sale
            </button>
            <button
              onClick={() => handleChange('transactionType', 'RENT')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filters.transactionType === 'RENT'
                  ? 'btn-premium text-white'
                  : 'glass-ultra text-slate-500 hover:text-slate-800'
              }`}
            >
              Rent
            </button>
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-2">
            Property Type
          </label>
          <select
            name="propertyType"
            value={filters.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="form-select"
          >
            {propertyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-2">
            Location
          </label>
          <select
            name="city"
            value={filters.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="form-select"
          >
            <option value="">All Cities</option>
            {PHILIPPINE_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-2">
            Price Range
          </label>
          <select
            value={`${filters.minPrice}-${filters.maxPrice}`}
            onChange={(e) => {
              const [min, max] = e.target.value.split('-');
              handlePriceRangeChange(min, max);
            }}
            className="form-select"
          >
            {priceRanges.map((range, idx) => (
              <option key={idx} value={`${range.min}-${range.max}`}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Price Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              className="form-input text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="form-input text-sm"
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-2">
            Bedrooms
          </label>
          <div className="flex gap-2">
            {['', '1', '2', '3', '4'].map((num) => (
              <button
                key={num}
                onClick={() => handleChange('bedrooms', num)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filters.bedrooms === num
                    ? 'btn-premium text-white'
                    : 'glass-ultra text-slate-500 hover:text-slate-800'
                }`}
              >
                {num === '' ? 'Any' : num === '4' ? '4+' : num}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button (for mobile) */}
        <button className="w-full py-3 rounded-xl btn-premium text-white font-semibold lg:hidden">
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default memo(PropertyFilters);
