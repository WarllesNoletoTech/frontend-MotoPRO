# MotoPRO Frontend — Vercel

Frontend Next.js 15 e PWA. Suba **o conteúdo desta pasta** na raiz de outro repositório GitHub (`motopro-frontend`).

## Implantação

1. Vercel > Add New > Project > importar `motopro-frontend`.
2. Framework Next.js; Root Directory `./` (porque este repositório é apenas o frontend).
3. Settings > Environment Variables, definir `API_INTERNAL_URL=https://URL-REAL-DO-HEROKU` (sem `/api` e sem barra final).
4. Deploy ou Redeploy após ajustar a variável.
5. Testar `https://SEU-FRONTEND.vercel.app/api/health`; o Next encaminha para Heroku.
6. Atualize `APP_ORIGIN` no Heroku para o domínio HTTPS **exato** exibido na Vercel, sem barra final.

O navegador chama caminhos relativos `/api/...`, e o Next.js encaminha ao Heroku. Isso evita usar outra origem no navegador e permite cookies de sessão HttpOnly do domínio frontend. Não use `NEXT_PUBLIC_API_URL` para chamar Heroku diretamente.

## Desenvolvimento local

```bash
npm install
# copie .env.example para .env.local
npm run dev
```


**No monorepo MotoPRO:** esta pasta chama-se `frontend-MotoPRO`. Veja o arquivo `README_DEPLOY.md` da raiz para configurar Vercel e Heroku a partir de um unico repositorio.
