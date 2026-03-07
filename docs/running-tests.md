# Executando os testes

Este projeto usa Playwright para testes E2E. Endpoints legados do Cypress permanecem para compatibilidade.

## Pré-requisitos

- Node.js 18+
- Dependências instaladas (`npm install` ou `pnpm install`)
- Variáveis de ambiente do Firebase e da aplicação configuradas (ver abaixo)

## Runners de teste atuais

- **Legado:** endpoints e histórico do Cypress ainda existem para compatibilidade com projetos monitorados que ainda não migraram.
- **Padrão:** Playwright é o runner padrão para novas execuções e novos projetos.

## Configuração local

1. Instale as dependências:

```bash
npm install
# ou: pnpm install
```

2. Configure as variáveis de ambiente exigidas pelo Next.js e Firebase.

Variáveis obrigatórias:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Variáveis opcionais:

- `CRON_SECRET` para proteção dos endpoints de cron
- `API_SECRET_KEY` para integrações que usam segredo
- `NEXT_PUBLIC_APP_URL` para links nas notificações

3. Inicie a aplicação localmente:

```bash
npm run dev
# ou: pnpm dev
```

## Playwright

Execute a suíte Playwright localmente:

```bash
npm run playwright:run
# ou: pnpm playwright:run
```

Abra o runner em modo UI:

```bash
npm run playwright:open
# ou: pnpm playwright:open
```

Execução manual via API para um projeto monitorado:

- Rota: `POST /api/playwright/run`
- Body:

```json
{
  "projectId": "id-do-projeto"
}
```

Requer autenticação Firebase via cookie de sessão da aplicação.

Execução agendada:

- Rota: `GET /api/cron/playwright`
- Header: `Authorization: Bearer <CRON_SECRET>`

A rota de cron chama o `playwrightRunUrl` de cada projeto ativo, grava o resultado no Firestore e envia notificação em caso de falha.

## Cypress (legado)

O Cypress permanece documentado apenas para projetos monitorados que ainda expõem endpoint de execução Cypress.

Execução manual via API:

- Rota: `POST /api/cypress/run`
- Body: `{ "projectId": "id-do-projeto" }`

Execução agendada:

- Rota: `GET /api/cron/cypress`
- Header: `Authorization: Bearer <CRON_SECRET>`

Se ainda precisar executar Cypress localmente em um projeto monitorado, mantenha as dependências e o endpoint remoto desse projeto. Esta aplicação monitora não usa mais Cypress como runner local padrão.

## Health checks

Execução manual:

- Rota: `POST /api/health-check`
- Body: `{ "projectId": "id-do-projeto" }`

Execução agendada:

- Rota: `GET /api/cron/health-check`
- Header: `Authorization: Bearer <CRON_SECRET>`

Execuções manuais e agendadas persistem resultados no Firestore.

## Configuração esperada do projeto monitorado

Para cada projeto, configure no dashboard as URLs relevantes:

- `frontHealthCheckUrl` para checagem de disponibilidade do front
- `backHealthCheckUrl` para health do back/API
- `cypressRunUrl` apenas para execução remota legada do Cypress
- `playwrightRunUrl` para o disparo remoto do Playwright

O endpoint remoto (Playwright ou Cypress) deve retornar JSON com os campos quando possível: `success`, `passed`, `failed`, `skipped`, `totalTests`, `duration`, `specFiles`, `output`, `error`.

## Persistência no Firestore

Resultados são armazenados nas coleções:

- `healthCheckResults`
- `cypressResults`
- `playwrightResults`

Projetos vêm da coleção `projects`; apenas projetos ativos são processados pelas rotas de cron.
