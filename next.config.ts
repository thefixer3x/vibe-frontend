import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // ppr: true, // Disabled for stable version
    // clientSegmentCache: true, // Disabled for stable version
    // nodeMiddleware: true // Disabled for stable version
  },
  trailingSlash: true,
  images: {
    unoptimized: true
  },
};

export default nextConfig;
