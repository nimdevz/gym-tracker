/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@gym-tracker/types',
    '@gym-tracker/validation',
    '@gym-tracker/intelligence',
  ],
  reactStrictMode: true,
};

module.exports = nextConfig;
