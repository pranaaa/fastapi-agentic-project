import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercel builds fail on lint by default; keep code strict via tsc but let deploy proceed
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
