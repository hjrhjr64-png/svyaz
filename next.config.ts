import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Используем webpack вместо Turbopack — из-за бага Turbopack с кириллическими путями */
  bundlePagesRouterDependencies: true,
};

export default nextConfig;
