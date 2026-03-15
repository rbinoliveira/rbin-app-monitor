# RBIN App Monitor

Monitore a saúde das suas aplicações, execute testes Cypress remotos e receba notificações por e-mail.

## Funcionalidades

- 🏥 **Health checks**: monitore a saúde do front (página) e do back (API)
- 🧪 **Integração Cypress**: execute testes E2E automaticamente ou sob demanda
- 📧 **Notificações por e-mail**: alertas quando health checks ou testes Cypress falharem
- 📊 **Dashboard**: visualize o status dos projetos e o histórico de execuções
- ⚡ **Monitoramento automatizado**: health checks e execuções de testes agendados

## Começando

### Pré-requisitos

- Node.js 18+ e npm/yarn/pnpm
- Projeto Firebase com Firestore habilitado
- Credenciais SMTP para envio de e-mail (ex.: Gmail, SendGrid, Mailgun)

### Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd rbin-app-monitor
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure as variáveis de ambiente (veja a seção [Variáveis de ambiente](#variáveis-de-ambiente))

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

5. Abra [http://localhost:3000](http://localhost:3000) no navegador

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as variáveis abaixo.

### Configuração Firebase (client-side)

Essas variáveis são expostas ao navegador (prefixo obrigatório `NEXT_PUBLIC_`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

**Como obter:** Firebase Console > Projeto > Configurações do projeto > Geral > Seção "Seus apps" > copie a configuração do app web.

**Habilitar login com Google:** Firebase Console > Autenticação > Método de login > Provedor "Google" > ativar e configurar e-mail de suporte. Em produção, adicione seu domínio em "Domínios autorizados".

### Configuração Firebase Admin (server-side)

**Opção 1: JSON da conta de serviço (recomendado para Vercel)**

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

Obtenha em: Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada. Cole o JSON em uma única linha (ou string escapada).

**Opção 2: Variáveis individuais**

```env
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu_projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Notificações por e-mail

Os alertas (health check falhou/restaurado, Cypress falhou) são enviados para `NOTIFICATION_EMAIL_TO`.

**Opção A – Resend (recomendado)**  
Apenas API key. Cadastro em [resend.com](https://resend.com), criar API key em [resend.com/api-keys](https://resend.com/api-keys).

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL_TO=seu@email.com
```

Para testes pode usar o remetente padrão `onboarding@resend.dev`. Em produção, adicione e verifique seu domínio no Resend e defina:

```env
RESEND_FROM=App Monitor <noreply@seudominio.com>
```

**Opção B – SMTP**  
Se não definir `RESEND_API_KEY`, o app usa SMTP (Gmail, SendGrid, Mailgun, etc.):

```env
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_usuario
SMTP_PASS=sua_senha
NOTIFICATION_EMAIL_TO=alertas@exemplo.com
```

### Segurança da API (opcional, recomendado)

```env
API_SECRET_KEY=sua_chave_secreta_aleatoria
```

Gere uma chave aleatória, por exemplo:

```bash
openssl rand -base64 32
```

## Estrutura do projeto

```
src/
├── app/                    # Rotas do App Router e APIs
│   ├── api/               # Rotas de API
│   │   ├── health-check/  # Health check
│   │   ├── cypress/       # Execução de testes Cypress
│   │   └── notify/        # Notificações
│   ├── projects/          # Páginas de projetos
│   └── history/           # Histórico de execuções
├── features/              # Lógica por domínio
├── shared/                # Componentes, libs e tipos compartilhados
```

## Desenvolvimento

### Scripts disponíveis

- `npm run dev` – Servidor de desenvolvimento
- `npm run build` – Build de produção
- `npm run start` – Servidor de produção
- `npm run lint` – ESLint
- `npm run format` – Prettier

## Contrato dos projetos monitorados

Para que um repositório funcione bem com o App Monitor usando GitHub Actions, o ideal é padronizar um contrato mínimo:

- ter um workflow em `.github/workflows/cypress-e2e.yml`
- esse workflow aceitar `workflow_dispatch`
- o workflow subir a aplicação por conta própria no CI
- o workflow rodar `pnpm test`
- o repositório expor `pnpm test` para Cypress headless
- opcionalmente expor `pnpm test:browser` para uso local

O App Monitor hoje dispara o workflow remoto por nome de arquivo e faz polling da execução no GitHub. Quanto mais autossuficiente for esse workflow, menor o acoplamento por projeto.

### Estilo de código

- **ESLint** para lint
- **Prettier** para formatação
- **TypeScript** em modo estrito

## Deploy

### Vercel (recomendado)

1. Envie o código para GitHub/GitLab/Bitbucket
2. Importe o projeto no [Vercel](https://vercel.com)
3. Adicione as variáveis de ambiente no dashboard do Vercel
4. O deploy ocorre automaticamente a cada push na branch principal

Para deploy manual: `npm i -g vercel` e depois `vercel`.

Configure `CRON_SECRET` para os cron jobs e `NEXT_PUBLIC_APP_URL` com a URL do deploy.

### Firebase Hosting

O projeto inclui configuração para Firebase Hosting. Para uso completo (APIs e cron), o Vercel é recomendado; o Hosting do Firebase atende bem páginas estáticas.

## Licença

MIT
