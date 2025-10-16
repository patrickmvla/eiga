import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**", // required so Next/Image can fetch TMDB posters
      },
    ],
    // Alternatively, this also works:
    // domains: ["image.tmdb.org"],
  },
};

export default nextConfig;