# RBIN App Monitor

Monitor your applications health, run Cypress tests and receive Telegram notifications.

## Features

- 🏥 **Health Checks**: Monitor web pages, REST APIs, and WordPress sites
- 🧪 **Cypress Integration**: Run E2E tests automatically or on-demand
- 📱 **Telegram Notifications**: Get instant alerts when something goes wrong
- 📊 **Dashboard**: View project status and execution history
- ⚡ **Automated Monitoring**: Scheduled health checks and test runs

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Firebase project with Firestore enabled
- Telegram Bot Token (get from [@BotFather](https://t.me/BotFather))

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

### Telegram Bot Configuration

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

**How to get these:**
1. **Bot Token**: Message [@BotFather](https://t.me/BotFather) on Telegram and create a new bot
2. **Chat ID**: 
   - Message [@userinfobot](https://t.me/userinfobot) to get your user ID, or
   - Send a message to your bot and check the webhook update

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

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Vercel

Make sure to add all environment variables in Vercel's dashboard:
- Go to Project Settings > Environment Variables
- Add all variables from `.env.local`
- For `FIREBASE_SERVICE_ACCOUNT_KEY`, paste the entire JSON as a single line

## License

MIT

