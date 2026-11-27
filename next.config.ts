import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No other site may load the app in a frame (clickjacking).
  async headers() {
    return [{
      source: "/:path*",
      headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }],
    }];
  },
};

export default nextConfig;
