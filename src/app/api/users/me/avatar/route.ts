import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import cloudinary, {
  uploadOptions,
  validateBase64Image,
  getPublicIdFromUrl,
} from '@/lib/cloudinary';

// POST /api/users/me/avatar - Upload/update profile image
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
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    const options = uploadOptions.avatar;

    // Validate image
    const validation = validateBase64Image(
      image,
      options.allowed_formats,
      options.max_file_size || 5 * 1024 * 1024
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    // Delete old avatar from Cloudinary if exists
    if (currentUser?.image) {
      const oldPublicId = getPublicIdFromUrl(currentUser.image);
      if (oldPublicId && oldPublicId.startsWith('buynsell/')) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }
    }

    // Upload new avatar
    const result = await cloudinary.uploader.upload(image, {
      folder: options.folder,
      transformation: options.transformation,
      resource_type: 'image',
      public_id: `user_${session.user.id}`, // Use consistent public_id for user
      overwrite: true,
    });

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        imageUrl: result.secure_url,
      },
      message: 'Profile image updated successfully',
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);

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

// DELETE /api/users/me/avatar - Remove profile image
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    if (!currentUser?.image) {
      return NextResponse.json(
        { success: false, error: 'No profile image to remove' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(currentUser.image);
    if (publicId && publicId.startsWith('buynsell/')) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile image removed',
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove image' },
      { status: 500 }
    );
  }
}
