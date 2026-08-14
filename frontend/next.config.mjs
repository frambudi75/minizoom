/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
