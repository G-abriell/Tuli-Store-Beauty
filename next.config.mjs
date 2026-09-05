/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "*.space-z.ai"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "*.supabase.co"
      }
    ]
  }
};

export default nextConfig;
