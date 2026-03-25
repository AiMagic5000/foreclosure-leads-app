import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/webcast/live',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors \'self\' https://assetrecoverybusiness.com https://usforeclosureleads.com',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/talks',
        destination: '/talks/index.html',
      },
      {
        source: '/lander',
        destination: '/lander/index.html',
      },
    ];
  },
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
