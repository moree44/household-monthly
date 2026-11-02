import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
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
