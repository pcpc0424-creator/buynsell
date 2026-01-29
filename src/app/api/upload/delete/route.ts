import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cloudinary, { getPublicIdFromUrl } from '@/lib/cloudinary';

// POST /api/upload/delete - Delete image(s) from Cloudinary
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
        { success: false, error: 'Image service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { publicId, publicIds, url, urls } = body;

    // Collect all public IDs to delete
    const idsToDelete: string[] = [];

    // Single public ID
    if (publicId) {
      idsToDelete.push(publicId);
    }

    // Multiple public IDs
    if (publicIds && Array.isArray(publicIds)) {
      idsToDelete.push(...publicIds);
    }

    // Extract from single URL
    if (url) {
      const extracted = getPublicIdFromUrl(url);
      if (extracted) {
        idsToDelete.push(extracted);
      }
    }

    // Extract from multiple URLs
    if (urls && Array.isArray(urls)) {
      urls.forEach((u: string) => {
        const extracted = getPublicIdFromUrl(u);
        if (extracted) {
          idsToDelete.push(extracted);
        }
      });
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid image identifiers provided' },
        { status: 400 }
      );
    }

    // Security check: Only allow deletion of images in buynsell folder
    const invalidIds = idsToDelete.filter((id) => !id.startsWith('buynsell/'));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete images outside of application scope' },
        { status: 403 }
      );
    }

    // Additional permission checks based on folder
    const isAdmin = session.user.role === 'ADMIN';
    const isAgent = session.user.role === 'AGENT';

    // Check if trying to delete advertisement images without admin
    const hasAdImages = idsToDelete.some((id) => id.includes('/advertisements/'));
    if (hasAdImages && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required to delete advertisement images' },
        { status: 403 }
      );
    }

    // Check if trying to delete listing images without proper role
    const hasListingImages = idsToDelete.some((id) => id.includes('/listings/'));
    if (hasListingImages && !isAdmin && !isAgent) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete from Cloudinary
    if (idsToDelete.length === 1) {
      // Single delete
      const result = await cloudinary.uploader.destroy(idsToDelete[0]);

      return NextResponse.json({
        success: true,
        data: {
          deleted: result.result === 'ok' ? 1 : 0,
          results: [{ publicId: idsToDelete[0], result: result.result }],
        },
      });
    } else {
      // Bulk delete
      const result = await cloudinary.api.delete_resources(idsToDelete);

      const deletedCount = Object.values(result.deleted).filter(
        (r) => r === 'deleted'
      ).length;

      return NextResponse.json({
        success: true,
        data: {
          deleted: deletedCount,
          total: idsToDelete.length,
          results: Object.entries(result.deleted).map(([id, status]) => ({
            publicId: id,
            result: status,
          })),
        },
      });
    }
  } catch (error: any) {
    console.error('Error deleting image:', error);

    if (error.http_code) {
      return NextResponse.json(
        { success: false, error: error.message || 'Delete failed' },
        { status: error.http_code }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
