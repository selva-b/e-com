/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  }, 
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/zero-threat.html',
        destination: '/zero-threat',
      },
    ];
  }
};

module.exports = nextConfig;
