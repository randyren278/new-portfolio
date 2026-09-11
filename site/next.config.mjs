/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow an isolated production preview alongside the running dev server.
  distDir: process.env.PORTFOLIO_BUILD_DIR || '.next',
};

export default nextConfig;
