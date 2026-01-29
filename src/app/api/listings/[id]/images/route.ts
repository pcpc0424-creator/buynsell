import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import cloudinary, { getPublicIdFromUrl, uploadOptions, validateBase64Image } from '@/lib/cloudinary';

interface RouteParams {
  params: { id: string };
}

// Validation schema for adding images
const addImagesSchema = z.object({
  images: z.array(
    z.object({
      url: z.string().url().optional(),
      base64: z.string().optional(),
      caption: z.string().optional(),
      order: z.number().int().min(0).optional(),
    })
  ).min(1).max(10),
});

// Validation schema for reordering
const reorderSchema = z.object({
  images: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});

// GET /api/listings/[id]/images - Get listing images
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        mainImage: true,
        status: true,
        agentId: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check access for non-approved listings
    if (listing.status !== 'APPROVED') {
      const session = await getServerSession(authOptions);
      const isAdmin = session?.user?.role === 'ADMIN';
      const isOwner = session?.user?.id === listing.agentId;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { success: false, error: 'Listing not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        mainImage: listing.mainImage,
        images: listing.images,
        totalImages: listing.images.length + 1, // +1 for main image
      },
    });
  } catch (error) {
    console.error('Error fetching listing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST /api/listings/[id]/images - Add images to listing
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Find listing
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === listing.agentId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = addImagesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { images } = validationResult.data;

    // Check max images (including existing)
    const maxImages = 10;
    const currentCount = listing.images.length;
    const newCount = images.length;

    if (currentCount + newCount > maxImages) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${maxImages} images allowed. Current: ${currentCount}, Trying to add: ${newCount}`,
        },
        { status: 400 }
      );
    }

    const options = uploadOptions.listing;
    const createdImages = [];
    const errors = [];

    // Get the next order number
    let nextOrder = listing.images.length > 0
      ? Math.max(...listing.images.map((img) => img.order)) + 1
      : 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        let imageUrl = image.url;

        // If base64 provided, upload to Cloudinary
        if (image.base64) {
          const validation = validateBase64Image(
            image.base64,
            options.allowed_formats,
            options.max_file_size || 10 * 1024 * 1024
          );

          if (!validation.valid) {
            errors.push({ index: i, error: validation.error });
            continue;
          }

          const result = await cloudinary.uploader.upload(image.base64, {
            folder: options.folder,
            transformation: options.transformation,
            resource_type: 'image',
          });

          imageUrl = result.secure_url;
        }

        if (!imageUrl) {
          errors.push({ index: i, error: 'No URL or base64 provided' });
          continue;
        }

        // Create image record
        const created = await prisma.listingImage.create({
          data: {
            listingId: id,
            url: imageUrl,
            caption: image.caption,
            order: image.order ?? nextOrder++,
          },
        });

        createdImages.push(created);
      } catch (err: any) {
        errors.push({ index: i, error: err.message || 'Failed to process image' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        added: createdImages,
        errors,
        totalImages: currentCount + createdImages.length,
      },
      message: `${createdImages.length} image(s) added${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    });
  } catch (error) {
    console.error('Error adding listing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add images' },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id]/images - Reorder images
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === listing.agentId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = reorderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { images } = validationResult.data;

    // Update orders in transaction
    await prisma.$transaction(
      images.map((img) =>
        prisma.listingImage.update({
          where: { id: img.id, listingId: id },
          data: { order: img.order },
        })
      )
    );

    // Fetch updated images
    const updatedImages = await prisma.listingImage.findMany({
      where: { listingId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: updatedImages,
      message: 'Images reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder images' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id]/images - Delete images
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === listing.agentId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageIds = searchParams.get('ids')?.split(',') || [];

    if (imageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image IDs provided' },
        { status: 400 }
      );
    }

    // Get images to delete
    const images = await prisma.listingImage.findMany({
      where: {
        id: { in: imageIds },
        listingId: id,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching images found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    const publicIds = images
      .map((img) => getPublicIdFromUrl(img.url))
      .filter((id): id is string => id !== null && id.startsWith('buynsell/'));

    if (publicIds.length > 0) {
      try {
        await cloudinary.api.delete_resources(publicIds);
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await prisma.listingImage.deleteMany({
      where: {
        id: { in: imageIds },
        listingId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${images.length} image(s) deleted`,
      deletedCount: images.length,
    });
  } catch (error) {
    console.error('Error deleting listing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete images' },
      { status: 500 }
    );
  }
}
