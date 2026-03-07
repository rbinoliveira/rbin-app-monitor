# Project Registration Requirements

This document defines the information required to register a monitored project in RBIN App Monitor and the prerequisites the monitored system must satisfy for health checks and remote test execution to work reliably.

## Required registration fields

### 1. Project name

- Field: `name`
- Why it matters: this is the human-readable identifier shown in the dashboard, execution history, notifications, and Firestore records.
- Recommendation: use a stable operational name such as `Billing API`, `Customer Portal`, or `Backoffice`.

### 2. Frontend URL

- Field: `frontHealthCheckUrl`
- Use when: the monitored project exposes a public frontend, landing page, SPA, or web app.
- Why it matters: the monitor performs a public availability check against this URL and expects a successful HTTP response.
- Typical examples:
  - `https://app.example.com`
  - `https://portal.example.com/login`

### 3. Backend health URL

- Field: `backHealthCheckUrl`
- Use when: the monitored project exposes an API, service, worker control endpoint, or dedicated health route.
- Why it matters: the monitor checks the API surface separately from the frontend and records backend-specific failures.
- Typical examples:
  - `https://api.example.com/health`
  - `https://api.example.com/api/status`

### 4. Playwright execution URL

- Field: `playwrightRunUrl`
- Use when: the monitored project can trigger its own Playwright suite remotely and return a JSON result.
- Why it matters: Playwright is the current default test runner for new monitored projects.
- Expected response shape:
  - `success`
  - `passed`
  - `failed`
  - `skipped`
  - `totalTests`
  - `duration`
  - `specFiles`
  - `output`
  - `error`

### 5. Legacy Cypress execution URL

- Field: `cypressRunUrl`
- Use when: the monitored project still depends on a legacy Cypress remote trigger.
- Why it matters: this keeps backward compatibility while projects migrate to Playwright.
- Recommendation: leave this empty for new projects unless Cypress is still required.

### 6. Project type

- Suggested product-level field: `type`
- Values:
  - `front`
  - `back`
  - `fullstack`
- Why it matters: the type clarifies which URLs should be mandatory in the registration flow and how the monitor interprets missing fields.

## Minimum registration rules by project type

### Frontend project

- Required:
  - `name`
  - `frontHealthCheckUrl`
- Optional:
  - `playwrightRunUrl`
  - `cypressRunUrl`
- Typical case: public website, admin panel, SPA, or marketing site.

### Backend project

- Required:
  - `name`
  - `backHealthCheckUrl`
- Optional:
  - `playwrightRunUrl`
  - `cypressRunUrl`
- Typical case: REST API, GraphQL API, microservice, webhook processor.

### Fullstack project

- Required:
  - `name`
  - at least one of `frontHealthCheckUrl` or `backHealthCheckUrl`
- Recommended:
  - provide both frontend and backend URLs when both exist
  - provide `playwrightRunUrl` if end-to-end tests are available

## Prerequisites in the monitored project

### Health check prerequisites

For the monitor to verify availability consistently, the monitored project should expose stable endpoints:

- Frontend:
  - a public URL reachable from the monitor environment
  - preferably returns HTTP `200`
  - should not require login, CAPTCHA, or geo-restricted access for the basic uptime check

- Backend:
  - a dedicated health/status endpoint such as `/health`, `/ready`, `/status`, or `/api/status`
  - preferably returns HTTP `200`
  - ideally returns structured JSON with service status and optional dependency metadata

Recommended backend JSON examples:

```json
{
  "status": "ok"
}
```

```json
{
  "status": "ok",
  "database": "up",
  "queue": "up"
}
```

### CORS considerations

- Public frontend checks usually do not need CORS adjustments because the monitor performs server-side requests.
- Remote test trigger endpoints may need to allow requests from the monitor environment if they validate origin or custom headers.

### Authentication for health routes

- Frontend health URLs should usually remain public.
- Backend health routes can be public if they return only minimal health metadata.
- If authentication is required on the backend health route, the current monitor implementation does not yet inject custom credentials for per-project health checks.
- Recommendation: expose a lightweight, non-sensitive readiness endpoint specifically for monitoring.

### Remote test execution prerequisites

To support `playwrightRunUrl` or `cypressRunUrl`, the monitored project must provide:

- an HTTP endpoint that starts the test run
- a JSON response with execution summary fields
- enough environment configuration in that project to run the suite unattended
- stable access to test credentials, base URLs, and any required fixtures

The monitor does not require an agent or library installed inside the monitored project by default. What it needs is an accessible remote endpoint that the monitored project owns and controls.

## Do we need to distinguish frontend and backend projects?

Yes. The distinction should exist in the registration model or at least in the UI flow because the monitoring behavior and required fields differ.

### Frontend health check behavior

- The monitor checks a public web URL.
- Success criteria:
  - reachable URL
  - expected HTTP success response, usually `200`
- Best for:
  - public apps
  - portals
  - dashboards
  - static sites

### Backend health check behavior

- The monitor checks an API or health endpoint.
- Success criteria:
  - reachable endpoint
  - expected HTTP success response
  - optionally structured JSON response from the service
- Best for:
  - APIs
  - worker backends with status routes
  - internal services exposed through a gateway

### Form impact

If the product distinguishes project type explicitly, the registration form can adapt:

- `front`:
  - emphasize `frontHealthCheckUrl`
  - keep backend URL optional or hidden

- `back`:
  - emphasize `backHealthCheckUrl`
  - keep frontend URL optional or hidden

- `fullstack`:
  - show both fields
  - explain that frontend and backend health are tracked independently

This reduces operator confusion and avoids registrations where a project is missing the most important monitoring target for its architecture.

## Recommended validation rules for the registration form

- Require `name`
- Require at least one of:
  - `frontHealthCheckUrl`
  - `backHealthCheckUrl`
  - `playwrightRunUrl`
  - `cypressRunUrl`
- If `type = front`, require `frontHealthCheckUrl`
- If `type = back`, require `backHealthCheckUrl`
- If `type = fullstack`, require at least one health URL and recommend both
- Validate all URLs as absolute `http` or `https` URLs
- Prefer `playwrightRunUrl` over `cypressRunUrl` for new setups
