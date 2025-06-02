import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
  },
};

export default nextConfig;
