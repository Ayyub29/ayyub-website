import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/categories",
        destination: "/settings/categories",
        permanent: false,
      },
      {
        source: "/budget",
        destination: "/settings/budget",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
