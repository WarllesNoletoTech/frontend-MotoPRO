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


## Fechamento semanal automático — Fase 1

A página **Relatórios** permite ao motoboy autorizar o envio semanal por e-mail,
com confirmação do endereço pelo link recebido. Ele pode cancelar a qualquer
momento, mesmo sem assinatura ativa. O envio **não é habilitado por padrão**.

A API exige `RESEND_API_KEY` e `REPORTS_FROM_EMAIL` reais no Heroku e o processo
agendado `npm run reports:weekly`. A Vercel não executa esse agendamento;
a inclusão do código não configura automaticamente a entrega de e-mails.
O painel Admin → Sistema mostra quantidade de e-mails habilitados, enviados e falhos.

## Fase 2 — MotoPRO v1.4.0

Telas novas: `/app/comprovantes` (fotografia, análise e confirmação) e `/app/conciliacao` (conferência de ganhos importados), além de planos de manutenção em `/app/moto`, dupla leitura opcional em `/app/assistente` e indicadores de IA em Admin > Sistema. Necessário publicar o backend da Fase 2 antes do frontend.

## Fase 3 — MotoPRO v1.5.0

Novas telas de entregas particulares (`/app/particulares`) e comparativo por plataforma
(`/app/plataformas`), conquistas pessoais em `/app/premiacoes` e indicadores agregados
na aba **Indicadores** do administrador. As entregas pendentes não entram nos ganhos:
o motoboy precisa confirmar o recebimento, operação idempotente protegida por índice
único do backend. Os ganhos do iFood e de outros aplicativos precisam ser identificados
**manualmente** no formulário de lançamentos; só Rappidex é importado quando integrado.

Para gerar um PDF, use o botão **PDF** das telas, que abre a impressão do navegador;
escolha **Salvar como PDF**. Para CSV, use o botão de exportação. Publique o backend
v1.5.0 **antes** do frontend. Consulte `LEIA_PRIMEIRO_FASE3.txt` na raiz do pacote.
