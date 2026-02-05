import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
