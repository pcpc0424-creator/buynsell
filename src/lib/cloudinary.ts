import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Upload options for different image types
export const uploadOptions = {
  listing: {
    folder: 'buynsell/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 10 * 1024 * 1024, // 10MB
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
    ],
  },
  listingThumb: {
    folder: 'buynsell/listings/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 300, crop: 'fill', quality: 'auto:good' },
    ],
  },
  avatar: {
    folder: 'buynsell/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
    ],
  },
  advertisement: {
    folder: 'buynsell/advertisements',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    max_file_size: 5 * 1024 * 1024, // 5MB
  },
};

export type UploadType = keyof typeof uploadOptions;

// Helper function to extract public_id from Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Helper function to validate file size
export function validateFileSize(base64: string, maxSizeBytes: number): boolean {
  // Base64 string length * 3/4 gives approximate bytes
  const sizeInBytes = (base64.length * 3) / 4;
  return sizeInBytes <= maxSizeBytes;
}

// Helper function to get file extension from base64
export function getFileExtension(base64: string): string | null {
  const match = base64.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : null;
}

// Validate base64 image
export function validateBase64Image(
  base64: string,
  allowedFormats: string[],
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  // Check if it's a valid base64 image
  if (!base64.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid image format' };
  }

  // Check file extension
  const extension = getFileExtension(base64);
  if (!extension || !allowedFormats.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format. Allowed: ${allowedFormats.join(', ')}`,
    };
  }

  // Check file size
  if (!validateFileSize(base64, maxSizeBytes)) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}
