import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb", // 画像20MB、動画100MBに対応（Base64エンコードを考慮）
    },
  },
};

export default nextConfig;
