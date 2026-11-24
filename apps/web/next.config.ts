import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@aileaders/domain",
    "@aileaders/validation",
    "@aileaders/design-tokens",
    "@aileaders/utils",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
    // proxy.ts runs on the import route. Multipart overhead can push a 10MB workbook
    // above the proxy buffering default, so keep this slightly above the app limit.
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
