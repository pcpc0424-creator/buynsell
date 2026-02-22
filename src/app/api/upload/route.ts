import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Upload directories by type
const UPLOAD_DIRS: Record<string, string> = {
  listing: 'properties',
  avatar: 'avatars',
  advertisement: 'advertisements',
};

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

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadPath, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate URL
    const url = `/uploads/${uploadDir}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        size: file.size,
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
