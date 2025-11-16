/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression
  compress: true,
  poweredByHeader: false,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false, // Enable optimization
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year for immutable images
  },
  
  // Headers for caching static assets
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Redirects for route optimization
  async redirects() {
    return [
      // Redirect old dashboard URLs if needed
      {
        source: '/dash',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Code splitting and bundling optimizations
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['@prisma/client'],
  },
  // NOTE: optimizeFonts removed due to Next.js version deprecation of this option.

  // Webpack optimizations
  webpack: (config: any, { dev, isServer }: any) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable more aggressive tree-shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },

  // Environment variables that should be available in the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig
