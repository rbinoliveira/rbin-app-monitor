# RBIN App Monitor

Monitor your applications health, run Cypress tests and receive email notifications.

## Features

- 🏥 **Health Checks**: Monitor front-end (page) and back-end (API) health
- 🧪 **Cypress Integration**: Run E2E tests automatically or on-demand
- 📧 **Email Notifications**: Get alerts when health checks fail or Cypress tests fail
- 📊 **Dashboard**: View project status and execution history
- ⚡ **Automated Monitoring**: Scheduled health checks and test runs

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Firebase project with Firestore enabled
- SMTP credentials for sending email (e.g. Gmail, SendGrid, Mailgun)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rbin-app-monitor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Firebase Configuration (Client-side)

These variables are exposed to the browser (required `NEXT_PUBLIC_` prefix):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Scroll to "Your apps" section
5. Copy the config values from your web app

**Enable Google Sign-In:**
1. Go to Firebase Console > Authentication > Sign-in method
2. Click on "Google" provider and enable it
3. Set your project support email
4. For production, add your domain to the "Authorized domains" list

### Firebase Admin Configuration (Server-side)

Choose one of the following options:

#### Option 1: Service Account JSON (Recommended for Vercel)

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**How to get this:**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content and paste it as a single line (or escaped JSON string)

#### Option 2: Individual Environment Variables

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**How to get these:**
1. Same as Option 1, but extract individual fields from the JSON

### Email Notifications

Alerts (health check failed/restored, Cypress failed) are sent to `NOTIFICATION_EMAIL_TO`.

**Option A – Resend (recommended, free tier: 100 emails/day, 3,000/month)**  
Uses only an API key (no SMTP password). Sign up at [resend.com](https://resend.com), create an API key at [resend.com/api-keys](https://resend.com/api-keys).

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL_TO=your@email.com
```

For testing you can use the default sender `onboarding@resend.dev`. For production, add and verify your domain in Resend and set:

```env
RESEND_FROM=App Monitor <noreply@yourdomain.com>
```

**Option B – SMTP**  
If you don’t set `RESEND_API_KEY`, the app uses SMTP (Gmail, SendGrid, Mailgun, etc.):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
NOTIFICATION_EMAIL_TO=alerts@example.com
```

### API Security (Optional but Recommended)

```env
API_SECRET_KEY=your_random_secret_key_here
```

Generate a random secret key for protecting cron endpoints. You can use:
```bash
openssl rand -base64 32
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API routes
│   │   ├── health-check/  # Health check endpoints
│   │   ├── cypress/       # Cypress test execution
│   │   └── notify/        # Notification endpoints
│   ├── projects/          # Project management pages
│   └── history/           # Execution history
├── components/            # React components
│   ├── layout/            # Layout components (Header, Sidebar)
│   └── ui/                # UI components (Button, Card, Input, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase client-side config
│   ├── firebase-admin.ts  # Firebase Admin server-side config
│   └── utils.ts           # Utility functions
├── services/              # Business logic services
└── types/                 # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type safety

## Deployment

### Vercel (Recommended)

#### Automatic Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure deployment
4. Add environment variables in Vercel dashboard (see below)
5. Deploy automatically happens on every push to main branch

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables in Vercel

Make sure to add all environment variables in Vercel's dashboard:
- Go to Project Settings > Environment Variables
- Add all variables from `.env.local`
- For `FIREBASE_SERVICE_ACCOUNT_KEY`, paste the entire JSON as a single line
- Set `CRON_SECRET` for cron job authentication
- Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL

### Vercel Configuration

The project includes `vercel.json` with cron job configuration:
- Cypress tests run daily at 2 AM UTC
- Health checks run every hour

Make sure to set `CRON_SECRET` environment variable in Vercel for cron authentication.

### Firebase Deployment

#### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```

#### Deploy to Firebase Hosting

```bash
# Build the application
pnpm build

# Deploy to Firebase
firebase deploy --only hosting
```

#### Automatic Deployment via GitHub Actions

The project includes `.github/workflows/firebase-deploy.yml` for automatic deployment:
- Deploys on push to `main` branch
- Can be triggered manually via `workflow_dispatch`
- Requires `FIREBASE_SERVICE_ACCOUNT_KEY` secret in GitHub

**Setup GitHub Secrets:**
1. Go to GitHub repository Settings > Secrets and variables > Actions
2. Add `FIREBASE_SERVICE_ACCOUNT_KEY` with your Firebase service account JSON
3. Add all Firebase environment variables (same as Vercel)

**Note:** Firebase Hosting configuration is provided, but Next.js API routes require a Node.js server. For full functionality, consider:
- Using Vercel for deployment (recommended - supports API routes and cron jobs)
- Setting up Firebase Functions for API routes (more complex setup)
- Using Firebase Hosting only for static pages (API routes won't work)

## License

MIT

