import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'd3',
      'recharts',
      'framer-motion',
      'date-fns',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'assetrecoverybusiness.com',
      },
      {
        protocol: 'https',
        hostname: '**.zillow.com',
      },
      {
        protocol: 'https',
        hostname: '**.zillowstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.realtor.com',
      },
      {
        protocol: 'https',
        hostname: '**.trulia.com',
      },
      {
        protocol: 'https',
        hostname: '**.redfin.com',
      },
      {
        protocol: 'https',
        hostname: 'ssl.cdn-redfin.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'streetviewpixels-pa.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
  },
};

export default nextConfig;
