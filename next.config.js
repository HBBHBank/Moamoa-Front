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
      {
        protocol: 'https',
        hostname: 'your-api-domain.com',
        pathname: '/static/**',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/.well-known/appspecific/:path*',
        destination: '/api/not-found',
        permanent: false,
      },
    ];
  },

  // ✅ /oauth/authorize는 정적 생성하지 않음
  experimental: {
    // App Router에서 동적 렌더링 지원을 명시적으로 활성화
    serverActions: true,
  },
  // ✅ 특정 경로에 대해 동적 처리 강제
  async headers() {
    return [
      {
        source: '/oauth/authorize',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store', // 프리렌더 방지
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;
