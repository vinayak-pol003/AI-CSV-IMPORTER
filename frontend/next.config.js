/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Proxies /api/* calls to the backend during local dev if NEXT_PUBLIC_API_URL
        // is not set to an absolute URL; harmless no-op otherwise since services/api.ts
        // uses NEXT_PUBLIC_API_URL directly when provided.
        source: "/backend-proxy/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
