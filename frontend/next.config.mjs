/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output: image final jauh lebih kecil (~100MB vs ~1GB)
  // Hanya include file yang diperlukan untuk production
  output: 'standalone',

  // Mempercepat build drastis di VPS: skip typecheck & linting saat build image
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
