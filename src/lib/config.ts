// Application configuration
export const config = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

// Helper to build API URLs
export function apiUrl(path: string): string {
  return `${config.basePath}${path}`;
}
