/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /qr-scanner-worker\.min\.js$/,
      type: 'asset/resource',
    });
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8070',
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8070',
        pathname: '/static/**',
      },
      // 프로덕션 환경을 위한 설정 (필요시 수정)
      {
        protocol: 'https',
        hostname: 'your-api-domain.com',
        pathname: '/static/**',
      }
    ],
  },
  async redirects() {
    return [
      // Chrome DevTools 관련 404 에러 방지
      {
        source: '/.well-known/appspecific/:path*',
        destination: '/api/not-found',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig 