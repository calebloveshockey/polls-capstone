/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
}
require('./db/dbInitializer');

module.exports = nextConfig
