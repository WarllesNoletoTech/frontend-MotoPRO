import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const api = (process.env.API_INTERNAL_URL || '').trim().replace(/\/$/, '');
    if (process.env.NODE_ENV === 'production' && !/^https:\/\/[^/]+/.test(api)) {
      throw new Error('Configure API_INTERNAL_URL com a URL HTTPS do backend Heroku nas variáveis da Vercel.');
    }
    const upstream = api || 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${upstream}/api/:path*` }];
  },
};
export default nextConfig;
