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


## Correção do erro Vercel "Configure API_INTERNAL_URL"

Este frontend agora **compila mesmo se API_INTERNAL_URL estiver ausente**. Nessa situação,
as chamadas para /api/* retornam HTTP 503 com uma explicação objetiva,
até que o endereço real do backend seja configurado. Isso evita que o build
quebre, mas não substitui a conexão real com o Heroku.

1. Abra seu projeto na Vercel > Settings > Environment Variables.
2. Adicione a variável de nome **API_INTERNAL_URL**.
3. No valor, use a origem HTTPS real do Heroku (exemplo ilustrativo:
   `https://seu-backend.herokuapp.com`, **não** o endereço do frontend).
4. Selecione os ambientes **Production** e **Preview** (e Development se necessário).
5. Salve e faça **Redeploy** da branch correta após incluir a variável.
6. Confira `https://SEU-FRONTEND.vercel.app/api/health`. A resposta do backend
   deve ter `status: "ok"` e `service: "motopro-api"`.

A variável **não deve conter** a parte `/api`, query string, senha ou espaços.
Não adicione `NEXT_PUBLIC_API_URL`: o acesso deve permanecer no mesmo domínio
para preservar os cookies de sessão. O aviso de Node.js 24 no build é
informativo e não causou o erro acima.
