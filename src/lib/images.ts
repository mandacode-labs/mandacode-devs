/**
 * Get the full image URL based on environment configuration
 * 
 * In development: uses local /images/ prefix
 * In production: uses PUBLIC_STATIC_BASE_URL (R2 CDN)
 * 
 * @param path - Image path (e.g., "projects/meerkat/cover.png")
 * @returns Full image URL
 */
export function getImageUrl(path: string): string {
  const baseUrl = import.meta.env.PUBLIC_STATIC_BASE_URL;
  
  // If base URL is set (production), use R2 CDN
  if (baseUrl) {
    return `${baseUrl}/${path}`;
  }
  
  // Development: use local images
  return `/images/${path}`;
}
