import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@cledger5/api-clients', '@cledger5/utils', '@cledger5/types'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
