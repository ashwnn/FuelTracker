/**
 * Image optimization utilities for FuelTracker
 * Provides helpers for using Next.js Image component efficiently
 */

/**
 * Get optimized image props for Next.js Image component
 * Handles modern format support and responsive sizing
 */
export function getImageProps(src: string, alt: string, options?: {
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
}) {
  return {
    src,
    alt,
    width: options?.width || 400,
    height: options?.height || 300,
    priority: options?.priority || false,
    fill: options?.fill || false,
    // Modern formats with fallback
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    // Enable lazy loading by default
    loading: options?.priority ? 'eager' : 'lazy',
    quality: 80, // Good balance between quality and size
  };
}

/**
 * Get srcSet for responsive images
 * Generates different sizes for different viewport widths
 */
export function getResponsiveSizes(maxWidth: number = 1200): string {
  return [320, 640, 960, 1280, maxWidth]
    .map((size) => `(max-width: ${size}px) ${size}px`)
    .join(', ');
}

/**
 * Preload images for faster rendering
 * Useful for critical images above the fold
 */
export function preloadImage(src: string): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
}

/**
 * Calculate optimal image dimensions based on viewport
 * Helps avoid layout shift
 */
export function getOptimalDimensions(
  aspectRatio: number,
  maxWidth: number = 400
): { width: number; height: number } {
  return {
    width: maxWidth,
    height: Math.round(maxWidth / aspectRatio),
  };
}

/**
 * Image size presets for common use cases
 */
export const IMAGE_PRESETS = {
  thumbnail: { width: 80, height: 80 },
  preview: { width: 200, height: 200 },
  card: { width: 320, height: 240 },
  hero: { width: 1200, height: 400 },
  fullWidth: { width: 1920, height: 1080 },
  square: { width: 400, height: 400 },
} as const;
