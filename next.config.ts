import type { NextConfig } from 'next';

// A URL do backend deve ser informada em Vercel > Settings > Environment Variables.
// Sem ela, o frontend ainda deve compilar, mas as APIs retornam erro explícito (503).
// Não colocar URLs fictícias de servidores em produção.
const apiOrigin = (process.env.API_INTERNAL_URL || '').trim().replace(/\/$/, '');
const isProduction = process.env.NODE_ENV === 'production';

if (apiOrigin) {
  let parsed: URL;
  try {
    parsed = new URL(apiOrigin);
  } catch {
    throw new Error('API_INTERNAL_URL inválida. Use a URL HTTPS completa do backend, sem /api.');
  }
  if (
    (isProduction && parsed.protocol !== 'https:') ||
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username || parsed.password ||
    parsed.pathname !== '/' || parsed.search || parsed.hash
  ) {
    throw new Error('API_INTERNAL_URL deve conter somente a origem HTTPS do backend, sem /api, parâmetros ou barra final.');
  }
} else if (isProduction) {
  console.warn('[MotoPRO] API_INTERNAL_URL ausente. O build continuará, mas /api/* retornará 503 até configurar a variável na Vercel e fazer Redeploy.');
}

const nextConfig: NextConfig = {
  async rewrites() {
    // Desenvolvimento local: Express na porta 4000, sem depender de .env.
    const destination = apiOrigin
      ? `${apiOrigin}/api/:path*`
      : isProduction ? '/backend-indisponivel' : 'http://localhost:4000/api/:path*';

    return [{ source: '/api/:path*', destination }];
  },
};

export default nextConfig;
