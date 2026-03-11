import { sendNotification } from '@/features/monitoring/services/email'
import { sendTelegramNotification } from '@/features/monitoring/services/telegram'
import type { CypressRunResult } from '@/features/monitoring/services/cypress-runner'

interface NotifyOptions {
  result: CypressRunResult
  projectId: string
  projectName: string
  trigger: 'manual' | 'cron'
}

/**
 * Business rules:
 * - Manual: email + telegram on success AND failure
 * - Cron:   email only on failure; telegram on success AND failure
 */
export async function sendCypressNotifications({
  result,
  projectId,
  projectName,
  trigger,
}: NotifyOptions): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dashboardUrl = `${baseUrl}/dashboard`
  const timestamp = new Date()

  if (result.success) {
    const details = `All Cypress tests passed for project "${projectName}".`
    const payload = {
      type: 'cypress_passed' as const,
      projectId,
      projectName,
      details,
      timestamp,
    }

    if (trigger === 'manual') {
      const [emailResult] = await Promise.all([
        sendNotification(payload),
        sendTelegramNotification(payload),
      ])
      if (!emailResult.success) {
        console.error(`[notify] Email (success) failed for "${projectName}":`, emailResult.error)
      }
    } else {
      // cron: telegram only on success
      await sendTelegramNotification(payload)
    }
  } else {
    const failedPart =
      result.failed > 0
        ? `\n<b>Failed Tests:</b> ${result.failed} out of ${result.totalTests}`
        : ''
    const details = `Cypress tests failed for project "${projectName}"${failedPart}\n\n<b>View Details:</b> <a href="${dashboardUrl}">${dashboardUrl}</a>`
    const payload = {
      type: 'cypress_failed' as const,
      projectId,
      projectName,
      details,
      timestamp,
    }

    // both triggers: email + telegram on failure
    const [emailResult] = await Promise.all([
      sendNotification(payload),
      sendTelegramNotification(payload),
    ])
    if (!emailResult.success) {
      console.error(`[notify] Email (failure) failed for "${projectName}":`, emailResult.error)
    }
  }
}
