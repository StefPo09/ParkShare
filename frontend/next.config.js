const { networkInterfaces } = require('node:os');

const lanAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);

const backendUrl = (process.env.BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

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

    // Allow phones and other computers on the local network to load dev assets.
    allowedDevOrigins: lanAddresses,

    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;