import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap/0.xml',
      },
    ];
  },
};

export default nextConfig;
