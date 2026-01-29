import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cloudinary, {
  uploadOptions,
  validateBase64Image,
  UploadType,
} from '@/lib/cloudinary';

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  originalIndex: number;
}

interface UploadError {
  index: number;
  error: string;
}

const MAX_IMAGES = 10;

// POST /api/upload/multiple - Upload multiple images
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Image upload service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { images, type = 'listing' } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 }
      );
    }

    // Validate upload type
    if (!Object.keys(uploadOptions).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid upload type' },
        { status: 400 }
      );
    }

    const options = uploadOptions[type as UploadType] as {
      folder: string;
      allowed_formats: string[];
      max_file_size?: number;
      transformation?: { width: number; height: number; crop: string; quality: string; }[];
    };

    // Check permissions based on type
    if (type === 'advertisement' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required for advertisement uploads' },
        { status: 403 }
      );
    }

    if (type === 'listing' && session.user.role !== 'AGENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only agents can upload listing images' },
        { status: 403 }
      );
    }

    const results: UploadResult[] = [];
    const errors: UploadError[] = [];

    // Process images concurrently with limit
    const uploadPromises = images.map(async (image: string, index: number) => {
      try {
        // Validate image
        const validation = validateBase64Image(
          image,
          options.allowed_formats,
          options.max_file_size || 10 * 1024 * 1024
        );

        if (!validation.valid) {
          return { error: { index, error: validation.error! } };
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
          folder: options.folder,
          transformation: options.transformation,
          resource_type: 'image',
        });

        return {
          success: {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            originalIndex: index,
          } as UploadResult,
        };
      } catch (err: any) {
        return {
          error: {
            index,
            error: err.message || 'Upload failed',
          },
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Separate successes and errors
    uploadResults.forEach((result) => {
      if (result.success) {
        results.push(result.success);
      } else if (result.error) {
        errors.push(result.error);
      }
    });

    // Sort results by original index
    results.sort((a, b) => a.originalIndex - b.originalIndex);

    return NextResponse.json({
      success: true,
      data: {
        uploaded: results,
        failed: errors,
        total: images.length,
        successCount: results.length,
        failedCount: errors.length,
      },
    });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
