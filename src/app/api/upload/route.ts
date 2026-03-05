import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (increased for original uploads)

// Upload directories by type
const UPLOAD_DIRS: Record<string, string> = {
  listing: 'properties',
  avatar: 'avatars',
  advertisement: 'advertisements',
};

// Image resize configurations by type
const RESIZE_CONFIG: Record<string, { width: number; height: number; fit: 'cover' | 'contain' | 'fill' }> = {
  advertisement: { width: 1920, height: 600, fit: 'cover' },
  listing: { width: 1200, height: 800, fit: 'cover' },
  avatar: { width: 300, height: 300, fit: 'cover' },
};

// Resize image using sharp
async function resizeImage(
  buffer: Buffer,
  type: string,
  fileType: string
): Promise<Buffer> {
  const config = RESIZE_CONFIG[type];

  if (!config) {
    return buffer; // No resize config, return original
  }

  try {
    let sharpInstance = sharp(buffer);

    // Get image metadata
    const metadata = await sharpInstance.metadata();

    // Only resize if image is larger than target
    if (metadata.width && metadata.height) {
      if (metadata.width > config.width || metadata.height > config.height) {
        sharpInstance = sharpInstance.resize(config.width, config.height, {
          fit: config.fit,
          position: 'center',
        });
      }
    }

    // Convert to appropriate format with quality optimization
    if (fileType === 'image/png') {
      return await sharpInstance.png({ quality: 85, compressionLevel: 9 }).toBuffer();
    } else if (fileType === 'image/webp') {
      return await sharpInstance.webp({ quality: 85 }).toBuffer();
    } else {
      // Default to JPEG for better compression
      return await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    }
  } catch (error) {
    console.error('Error resizing image:', error);
    return buffer; // Return original on error
  }
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'listing';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

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

    // Get upload directory
    const uploadDir = UPLOAD_DIRS[type] || 'properties';
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', uploadDir);

    // Ensure directory exists
    await mkdir(uploadPath, { recursive: true });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    // Resize image
    const resizedBuffer = await resizeImage(originalBuffer, type, file.type);

    // Generate unique filename (keep original extension or use jpg for resized)
    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadPath, filename);

    // Save resized image
    await writeFile(filePath, resizedBuffer);

    // Generate URL
    const url = `/uploads/${uploadDir}/${filename}`;

    // Calculate compression ratio
    const compressionRatio = ((1 - resizedBuffer.length / originalBuffer.length) * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        originalSize: file.size,
        size: resizedBuffer.length,
        compressionRatio: `${compressionRatio}%`,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
