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

  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy (CSP) - Prevents XSS attacks
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; " +
                  "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com; " +
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " + // Added cdn.jsdelivr.net
                  "font-src 'self' https://fonts.gstatic.com; " +
                  "connect-src 'self' http://localhost:8000 https://alihaidernoorani-todo-app.hf.space https://cdn.jsdelivr.net; " + // Added cdn.jsdelivr.net
                  "img-src 'self' blob: data:; " +
                  "media-src 'self'; " +
                  "frame-ancestors 'self'; " +
                  "object-src 'none'; " +
                  "base-uri 'self'; " +
                  "form-action 'self';"
          },
          // X-Frame-Options - Prevents clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // X-Content-Type-Options - Prevents MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // X-DNS-Prefetch-Control - Controls DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Referrer-Policy - Controls referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions-Policy - Controls browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
