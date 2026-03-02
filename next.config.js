/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'playwright-core', 'notebooklm-kit', 'pdf-lib'],
  },
}

module.exports = nextConfig
