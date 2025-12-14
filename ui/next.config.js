/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/kb/:path*',
        destination: 'http://localhost:8000/api/kb/:path*',
      },
    ]
  },
}

module.exports = nextConfig
