import type { NextConfig } from 'next';

function getApiOrigin(raw?: string): string {
  const fallback = 'http://localhost:8001';
  if (!raw) return fallback;
  return raw.replace(/\/+$/, '').replace(/\/api$/, '');
}

const nextConfig: NextConfig = {
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
    const apiOrigin = getApiOrigin(process.env.NEXT_PUBLIC_API_URL);
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
