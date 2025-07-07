import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    'puppeteer-extra',
    'puppeteer-extra-plugin-stealth', 
    'puppeteer',
    'playwright'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-side packages in client build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
