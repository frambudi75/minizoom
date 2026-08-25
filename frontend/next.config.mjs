/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output: image final jauh lebih kecil (~100MB vs ~1GB)
  // Hanya include file yang diperlukan untuk production
  output: 'standalone',
  // Proxy API request ke backend (tidak perlu CORS dari browser)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://backend:8000/api/:path*' 
          : 'http://localhost:8000/api/:path*',
      },
    ];
  },

  // Cache HTTP headers untuk aset statis agar tidak di-download ulang setiap kali
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },

  // Optimasi image dari domain eksternal
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Format modern (WebP/AVIF) lebih kecil dari JPG
    formats: ['image/avif', 'image/webp'],
  },

  // Kompres response HTTP
  compress: true,

  // Matikan powered by header (security + sedikit lebih cepat)
  poweredByHeader: false,
};

export default nextConfig;
