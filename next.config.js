/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose Vite-style Supabase env vars to client (Next.js only inlines NEXT_PUBLIC_* by default)
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
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
