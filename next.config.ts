import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  },
  trailingSlash: true,
  images: {
    unoptimized: true
  },
};

export default nextConfig;
