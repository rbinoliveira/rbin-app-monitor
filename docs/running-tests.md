# Running Tests

This project is migrating from Cypress to Playwright.

## Current test runners

- Legacy: Cypress endpoints and saved history still exist for backward compatibility with monitored projects that have not migrated yet.
- Standard: Playwright is the default runner for new executions and new project setup.

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure the environment variables required by Next.js and Firebase.

Required application variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Optional execution variables:

- `CRON_SECRET` for protected cron endpoints
- `API_SECRET_KEY` if you use secret-based integrations
- `NEXT_PUBLIC_APP_URL` for notification links

3. Start the app locally:

```bash
pnpm dev
```

## Playwright

Run the Playwright suite locally:

```bash
pnpm playwright:run
```

Open the Playwright UI runner locally:

```bash
pnpm playwright:open
```

Manual API execution for a monitored project:

- Route: `POST /api/playwright/run`
- Body:

```json
{
  "projectId": "your-project-id"
}
```

This route requires Firebase authentication through the app session cookie.

Scheduled execution:

- Route: `GET /api/cron/playwright`
- Header: `Authorization: Bearer <CRON_SECRET>`

The cron route calls each active project `playwrightRunUrl`, stores the result in Firestore, and sends a notification when the run fails.

## Cypress (legacy)

Cypress remains documented only for monitored projects that still expose a Cypress execution endpoint.

Manual API execution for a monitored project:

- Route: `POST /api/cypress/run`
- Body:

```json
{
  "projectId": "your-project-id"
}
```

Scheduled execution:

- Route: `GET /api/cron/cypress`
- Header: `Authorization: Bearer <CRON_SECRET>`

If you still need local Cypress execution in a monitored project, keep that project’s own Cypress dependencies and remote run endpoint available. This monitor app no longer uses Cypress as the default local runner.

## Health checks

Manual health check execution:

- Route: `POST /api/health-check`
- Body:

```json
{
  "projectId": "your-project-id"
}
```

Scheduled health check execution:

- Route: `GET /api/cron/health-check`
- Header: `Authorization: Bearer <CRON_SECRET>`

Manual and scheduled runs both persist results to Firestore.

## Expected monitored project configuration

For each monitored project, configure the relevant URLs in the dashboard:

- `frontHealthCheckUrl` for public frontend availability checks
- `backHealthCheckUrl` for backend/API health checks
- `cypressRunUrl` only for legacy remote Cypress execution
- `playwrightRunUrl` for the remote Playwright trigger

The remote Playwright or Cypress endpoint should return JSON with these fields when possible:

- `success`
- `passed`
- `failed`
- `skipped`
- `totalTests`
- `duration`
- `specFiles`
- `output`
- `error`

## Firestore persistence

Execution results are stored in these collections:

- `healthCheckResults`
- `cypressResults`
- `playwrightResults`

Projects are read from `projects`, and only active projects are processed by cron routes.
