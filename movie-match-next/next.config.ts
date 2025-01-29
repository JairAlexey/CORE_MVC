/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      domains: ['image.tmdb.org'],
  },
  async rewrites() {
      return [
          {
              source: '/api/:path*',
              destination: 'http://localhost:3000/api/:path*',
          },
      ];
  },
};

module.exports = nextConfig;