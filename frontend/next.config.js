/** @type {import('next').NextConfig} */
const nextConfig = {
    // React Strict Mode helps catch common bugs during development
    reactStrictMode: true,

    // External image configuration for <Image /> component
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
        ],
    },
};

module.exports = nextConfig;