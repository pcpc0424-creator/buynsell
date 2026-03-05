// Application configuration
export const config = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

// Helper to build API URLs
export function apiUrl(path: string): string {
  return `${config.basePath}${path}`;
}

// Helper to get proper image URL for display
// Prepends basePath to local upload paths
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  // If it's a local upload path, prepend basePath
  if (url.startsWith('/uploads/')) {
    return `${config.basePath}${url}`;
  }
  return url;
}

// Check if image is a local upload (needs unoptimized for Next.js Image)
export function isLocalUpload(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('/uploads/') || url.startsWith(`${config.basePath}/uploads/`);
}
