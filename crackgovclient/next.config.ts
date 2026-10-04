import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep Turbopack scoped to this app in the monorepo instead of inferring the
  // workspace root from the parent and client lockfiles.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
