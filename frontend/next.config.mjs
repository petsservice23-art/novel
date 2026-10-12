/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly tell Turbopack to use the current directory as root
  experimental: {
    // This helps when Next.js detects a lockfile in a parent directory
    turbopack: {
      root: '.'
    }
  }
};

export default nextConfig;
