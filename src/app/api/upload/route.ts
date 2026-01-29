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
}

// POST /api/upload - Upload single image
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
    const { image, type = 'listing' } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
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

    // Validate image
    const validation = validateBase64Image(
      image,
      options.allowed_formats,
      options.max_file_size || 10 * 1024 * 1024
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: options.folder,
      transformation: options.transformation,
      resource_type: 'image',
    });

    const uploadResult: UploadResult = {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };

    return NextResponse.json({
      success: true,
      data: uploadResult,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);

    // Handle Cloudinary specific errors
    if (error.http_code) {
      return NextResponse.json(
        { success: false, error: error.message || 'Upload failed' },
        { status: error.http_code }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
