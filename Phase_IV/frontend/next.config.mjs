/** @type {import('next').NextConfig} */

// Derive backend host for the rewrite proxy.
// BACKEND_URL is set at build time (Dockerfile ARG) to http://backend:8000/api
// Strip the /api suffix to get the raw host for path-based proxying.
const backendHost = (process.env.BACKEND_URL || 'http://backend:8000/api')
  .replace(/\/api\/?$/, '')

const nextConfig = {
  reactStrictMode: true,

  // React Compiler (moved out of experimental in Next.js 15+)
  reactCompiler: false, // Disable for now, enable when stable

  // Standalone output for Docker deployment
  output: 'standalone',

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

  // Proxy all /backend-proxy/* requests to the backend service.
  // Browser code calls /backend-proxy/api/{userId}/... (same origin, no CORS).
  // Next.js server forwards to http://backend:8000/api/{userId}/... (internal k8s DNS).
  async rewrites() {
    return [
      {
        source: '/backend-proxy/:path*',
        destination: `${backendHost}/:path*`,
      },
    ]
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
                  "connect-src 'self' http://localhost:* http://localhost:3000 http://localhost:8000 http://localhost:30000 http://localhost:30001 https://alihaidernoorani-todo-app.hf.space https://cdn.jsdelivr.net; " + // Added localhost ports for Kubernetes
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
