import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/media/**",
      },
      {
        pathname: "/icon",
      },
      {
        pathname: "/apple-icon",
      },
    ],
  },
  async rewrites() {
    // Browsers still request /favicon.ico; map it to the dynamic store logo icon.
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;
