import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
  },
  // iyzipay uses dynamic requires at module init; Turbopack can't trace it,
  // so keep it as a real Node module at runtime.
  serverExternalPackages: ["iyzipay"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
