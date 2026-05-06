import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use webpack for dev to avoid Turbopack/PostCSS panic with globals.css (use "dev:turbo" for Turbopack)
  turbopack: false,
  // Allow dev server to serve assets when opened from another device (e.g. phone at http://192.168.1.5:3000)
  allowedDevOrigins: ['http://192.168.1.5:3000', 'http://10.2.0.2:3000'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
