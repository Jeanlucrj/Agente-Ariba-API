/** @type {import('next').NextConfig} */

// URL interna Docker (server-side rewrite). Fallback para desenvolvimento local.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // O cliente SEMPRE usa /api-proxy (URL relativa — sem localhost, sem IP fixo).
  // O Next.js server-side faz o rewrite para o container backend via rede Docker.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api-proxy',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Agente Ariba Enterprise AI',
  },

  async rewrites() {
    return [
      {
        // Qualquer chamada do browser para /api-proxy/... é interceptada
        // pelo Next.js server e repassada ao backend via rede interna Docker.
        source: '/api-proxy/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
      },
    ];
  },

  // Desativa o aviso de CORS para chamadas server-side em dev
  async headers() {
    return [
      {
        source: '/api-proxy/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
