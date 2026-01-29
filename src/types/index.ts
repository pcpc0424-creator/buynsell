import type {
  User,
  Listing,
  AgentProfile,
  Inquiry,
  TierPolicy,
  Subscription,
  Advertisement,
  FeaturedListing,
} from '@prisma/client';

// Extended types with relations
export type UserWithProfile = User & {
  agentProfile?: AgentProfile | null;
};

export type ListingWithAgent = Listing & {
  agent: User & {
    agentProfile?: AgentProfile | null;
  };
  images: { id: string; url: string; caption?: string | null; order: number }[];
};

export type ListingWithDetails = ListingWithAgent & {
  _count: {
    inquiries: number;
    favorites: number;
  };
};

// Filter types
export interface ListingFilters {
  transactionType?: 'RENT' | 'SALE';
  propertyType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface ListingFormData {
  title: string;
  description?: string;
  price: number;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  propertyStatus?: string;
  address: string;
  city: string;
  barangay?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  mainImage: string;
  images?: string[];
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

// Re-export Prisma types
export type {
  User,
  Listing,
  AgentProfile,
  Inquiry,
  TierPolicy,
  Subscription,
  Advertisement,
  FeaturedListing,
};
