/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // React Compiler (moved out of experimental in Next.js 15+)
  reactCompiler: false, // Disable for now, enable when stable

  // Other experimental features
  experimental: {},

  // Environment variables accessible in browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Image optimization
  images: {
    domains: [],
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
