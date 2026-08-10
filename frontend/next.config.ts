import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating Next.js dev tooling indicator, even in `next dev`.
  // We show this UI to non-technical folks, and the indicator is noise for them.
  devIndicators: false,
};

export default nextConfig;
