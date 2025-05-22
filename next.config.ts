import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 임시적으로 ESLint 빌드시 무시 설정
  },
}

export default nextConfig;
