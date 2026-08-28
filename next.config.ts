import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanaathrumylens.co.ke",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "www.saaathrumylens.co.ke",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
