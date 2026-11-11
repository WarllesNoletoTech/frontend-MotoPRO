import {NextResponse} from 'next/server';

// Destino de contingência quando API_INTERNAL_URL não foi configurada na Vercel.
// Ao definir a variável e refazer o deploy, as requisições voltam a ser
// encaminhadas diretamente ao backend pelo rewrite em next.config.ts.
const unavailable=()=>NextResponse.json(
 {error:'Backend do MotoPRO não configurado na Vercel. Defina API_INTERNAL_URL com a URL HTTPS do Heroku (sem /api) e faça Redeploy.'},
 {status:503,headers:{'Cache-Control':'no-store'}}
);
export const GET=unavailable;
export const POST=unavailable;
export const PUT=unavailable;
export const PATCH=unavailable;
export const DELETE=unavailable;
