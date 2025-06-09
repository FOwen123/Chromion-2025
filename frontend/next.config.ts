import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    SUPABASE_BASE_URL: process.env.NEXT_PUBLIC_SUPABASE_BASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
