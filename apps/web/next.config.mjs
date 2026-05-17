/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  transpilePackages: ['@sackerl/api-client', '@sackerl/tokens', '@sackerl/ui'],
};

export default nextConfig;
