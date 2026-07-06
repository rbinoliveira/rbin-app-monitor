import { getProjectById } from '@/features/projects/services/projects'
import { getUserGithubToken } from '@/features/settings/services/user-github-credential'
import type { CypressResult } from '@/shared/types/cypress-result.type'

import {
  collectCypressRun,
  makeCypressErrorResult,
  parseGithubRepo,
} from './cypress-github-actions'
import { sendCypressNotifications } from './cypress-notify'
import { completeCypressResult } from './cypress-results'
import type { CypressRunResult } from './cypress-runner'

const STALE_PENDING_MS = 60 * 60 * 1000

export type ReconcileOutcome = 'completed' | 'still-running' | 'expired'

async function completeAndNotify(
  pending: CypressResult,
  result: CypressRunResult,
  userId: string,
): Promise<void> {
  const transitioned = await completeCypressResult(pending.id, result)
  if (!transitioned) return

  try {
    await sendCypressNotifications({
      result,
      projectId: pending.projectId,
      projectName: pending.projectName,
      trigger: pending.trigger ?? 'cron',
      userId,
    })
  } catch (error) {
    console.error(
      `Error sending notification for project ${pending.projectName}:`,
      error,
    )
  }
}

export async function reconcilePendingCypressResult(
  pending: CypressResult,
): Promise<ReconcileOutcome> {
  const project = await getProjectById(pending.projectId)
  const parsed = pending.githubRepo ? parseGithubRepo(pending.githubRepo) : null
  const credential = await getUserGithubToken(project.userId)

  const expirePending = async (error: string): Promise<ReconcileOutcome> => {
    const result = makeCypressErrorResult(error)
    result.output = pending.output
    await completeAndNotify(pending, result, project.userId)
    return 'expired'
  }

  if (!parsed || !pending.githubRunId) {
    return expirePending('Pending result has no GitHub run reference')
  }

  if (!credential) {
    return expirePending(
      `User ${project.userId} has no GitHub integration configured`,
    )
  }

  const result = await collectCypressRun(
    parsed.owner,
    parsed.repo,
    pending.githubRunId,
    credential.token,
  )

  if (result) {
    await completeAndNotify(pending, result, project.userId)
    return 'completed'
  }

  const ageMs = Date.now() - pending.timestamp.getTime()
  if (ageMs > STALE_PENDING_MS) {
    return expirePending(
      'GitHub Actions run did not complete within the monitoring window',
    )
  }

  return 'still-running'
}
