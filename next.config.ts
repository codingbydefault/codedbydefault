import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/downloads/codedbydefault-cbd-ai-automatiseringsgids-2026.pdf",
        destination: "/api/guide/download",
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/guide/download": ["./private/guides/**/*"],
  },
};

export default nextConfig;
