/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@gym-tracker/types',
    '@gym-tracker/validation',
    '@gym-tracker/intelligence',
  ],
  reactStrictMode: true,
  webpack: (config) => {
    // Workspace packages use NodeNext-style `.js` relative imports
    // (e.g. `./volume.js` -> `./volume.ts`). Map them for the browser build.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      ...(config.resolve.extensionAlias || {}),
    };
    return config;
  },
};

module.exports = nextConfig;
