import { Timestamp } from 'firebase-admin/firestore'

import { getAdminDb } from '@/shared/lib/firebase-admin'
import type { CypressResult, CypressResultDoc } from '@/shared/types/cypress-result.type'

import type { CypressRunResult } from './cypress-runner'

const CYPRESS_RESULTS_COLLECTION = 'cypressResults'

function cypressResultToFirestore(result: CypressResult): CypressResultDoc {
  return {
    runner: 'cypress',
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

export interface SaveCypressResultInput {
  projectId: string
  projectName: string
  result: CypressRunResult
}

export async function saveCypressResult(
  input: SaveCypressResultInput,
): Promise<CypressResult> {
  if (!input.projectId || typeof input.projectId !== 'string') {
    throw new Error('Project ID is required')
  }

  if (!input.projectName || typeof input.projectName !== 'string') {
    throw new Error('Project name is required')
  }

  const now = new Date()
  const cypressResult: CypressResult = {
    id: '',
    runner: 'cypress',
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

  const docRef = getAdminDb().collection(CYPRESS_RESULTS_COLLECTION).doc()
  await docRef.set(
    cypressResultToFirestore({ ...cypressResult, id: docRef.id }),
  )

  return { ...cypressResult, id: docRef.id }
}
