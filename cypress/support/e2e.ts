// ────────────────────────────────
// Cypress E2E Support
// ────────────────────────────────

import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom commands here
    }
  }
}

