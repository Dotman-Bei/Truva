import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build (for inspection) live beside a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Optional peer deps pulled in by wagmi's WalletConnect connector; Truva doesn't use them.
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // MetaMask SDK references a React Native storage module the web build never uses.
    config.resolve.fallback = { ...config.resolve.fallback, "@react-native-async-storage/async-storage": false };
    return config;
  },
};

export default nextConfig;
