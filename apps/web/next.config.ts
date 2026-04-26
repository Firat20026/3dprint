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
  webpack: (config, { dev }) => {
    // Disable HMR in production to prevent WebSocket connection failures
    if (!dev) {
      config.optimization.minimize = true;
    }
    return config;
  },
};

export default nextConfig;
