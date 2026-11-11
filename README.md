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


## Relatórios semanais manuais — MotoPRO 1.8.2

O motoboy consulta o fechamento semanal no aplicativo, exporta CSV e compartilha
voluntariamente o resumo pelo WhatsApp. **Não há envio automático por e-mail**,
confirmação de endereço para relatórios, nem tarefa agendada para esse serviço.
O e-mail da conta permanece para identificação e funcionalidades de autenticação.

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


## Fase 4 — MotoPRO 1.6.0

Consulte `LEIA_PRIMEIRO_FASE4.txt`, `ALTERACOES_FASE4.md` e `CHECKLIST_HOMOLOGACAO_FASE4.md` na raiz do ZIP completo. A versão inclui despesas recorrentes, avisos internos, produtividade e métricas de adoção; não inclui push nem cobrança de despesas reais.

## MotoPRO 1.7.0 — Fase 5

Ver `../LEIA_PRIMEIRO_FASE5.txt`, `../ALTERACOES_FASE5.md` e `../CHECKLIST_HOMOLOGACAO_FASE5.md`. A ativação de notificações Web Push exige chaves VAPID e agendador Heroku, e o fluxo de privacidade é de solicitação/atendimento manual, sem exclusão automática.


## Identidade Premium MotoPRO v1.8.0

Interface escura em preto grafite + laranja, navegação agrupada, design responsivo e nova marca de motocicleta. Veja `../ALTERACOES_VISUAIS.md` no pacote completo. O backend v1.7.0 permanece compatível e inalterado.
