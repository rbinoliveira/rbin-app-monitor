import { Timestamp } from 'firebase-admin/firestore'

import { getAdminDb } from '@/shared/lib/firebase-admin'
import type { PlaywrightResult, PlaywrightResultDoc } from '@/shared/types'

import type { PlaywrightRunResult } from './playwright-runner'

const PLAYWRIGHT_RESULTS_COLLECTION = 'playwrightResults'

function playwrightResultToFirestore(result: PlaywrightResult): PlaywrightResultDoc {
  return {
    projectId: result.projectId,
    projectName: result.projectName,
    success: result.success,
    totalTests: result.totalTests,
    passed: result.passed,
    failed: result.failed,
    skipped: result.skipped,
    duration: result.duration,
    specFiles: result.specFiles,
    output: result.output,
    timestamp: Timestamp.fromDate(result.timestamp),
  }
}

export interface SavePlaywrightResultInput {
  projectId: string
  projectName: string
  result: PlaywrightRunResult
}

export async function savePlaywrightResult(
  input: SavePlaywrightResultInput,
): Promise<PlaywrightResult> {
  if (!input.projectId || typeof input.projectId !== 'string') {
    throw new Error('Project ID is required')
  }

  if (!input.projectName || typeof input.projectName !== 'string') {
    throw new Error('Project name is required')
  }

  if (!input.result || typeof input.result !== 'object') {
    throw new Error('Playwright result is required')
  }

  const now = new Date()
  const playwrightResult: PlaywrightResult = {
    id: '',
    projectId: input.projectId,
    projectName: input.projectName,
    success: input.result.success,
    totalTests: input.result.totalTests,
    passed: input.result.passed,
    failed: input.result.failed,
    skipped: input.result.skipped,
    duration: input.result.duration,
    specFiles: input.result.specFiles,
    output: input.result.output,
    timestamp: now,
  }

  const docRef = getAdminDb().collection(PLAYWRIGHT_RESULTS_COLLECTION).doc()
  await docRef.set(
    playwrightResultToFirestore({ ...playwrightResult, id: docRef.id }),
  )

  return {
    ...playwrightResult,
    id: docRef.id,
  }
}
