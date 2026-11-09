import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    },
    // Navigasi balik ke halaman dinamis dalam 60 detik paint instan dari
    // client router cache; mutasi tetap fresh karena updateTag di server action.
    staleTimes: {
      dynamic: 60
    }
  },
  outputFileTracingIncludes: {
    "/*": [
      "./src/features/transactions/agent.md",
      "./src/features/transactions/skill.md",
      "./src/features/transactions/memory.md"
    ]
  }
};

export default nextConfig;
