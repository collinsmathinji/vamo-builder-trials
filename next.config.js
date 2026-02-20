/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  // Avoid corrupted webpack cache (ENOENT vendor-chunks) on Windows / path with spaces
  webpack: (config, { dev }) => {
    if (dev) config.cache = false;
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
