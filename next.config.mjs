/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/buynsell',
  assetPrefix: '/buynsell',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
