import type { CypressRunResult } from '@/features/monitoring/services/cypress-runner'
import { sendNotification } from '@/features/monitoring/services/email'
import { sendTelegramNotification } from '@/features/monitoring/services/telegram'
import { getUserTelegramCredentials } from '@/features/settings/services/user-telegram-credential'

interface NotifyOptions {
  result: CypressRunResult
  projectId: string
  projectName: string
  trigger: 'manual' | 'cron'
  userId: string
}

export async function sendCypressNotifications({
  result,
  projectId,
  projectName,
  trigger,
  userId,
}: NotifyOptions): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dashboardUrl = `${baseUrl}/dashboard`
  const timestamp = new Date()
  const telegramCredentials = await getUserTelegramCredentials(userId)

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
        sendTelegramNotification(payload, telegramCredentials),
      ])
      if (!emailResult.success) {
        console.error(
          `[notify] Email (success) failed for "${projectName}":`,
          emailResult.error,
        )
      }
    } else {
      await sendTelegramNotification(payload, telegramCredentials)
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

    const [emailResult] = await Promise.all([
      sendNotification(payload),
      sendTelegramNotification(payload, telegramCredentials),
    ])
    if (!emailResult.success) {
      console.error(
        `[notify] Email (failure) failed for "${projectName}":`,
        emailResult.error,
      )
    }
  }
}
