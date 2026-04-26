import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Disable static optimization for error pages to avoid build issues
  output: 'standalone',
};

export default nextConfig;
