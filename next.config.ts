import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { workerThreads: true, webpackBuildWorker: false, cpus: 2 },
};
export default config;
