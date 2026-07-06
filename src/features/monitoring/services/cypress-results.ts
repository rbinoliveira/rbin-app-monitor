import { Timestamp } from 'firebase-admin/firestore'

import { getAdminDb } from '@/shared/libs/firebase-admin'
import type {
  CypressResult,
  CypressResultDoc,
  CypressTrigger,
} from '@/shared/types/cypress-result.type'

import type { CypressRunResult } from './cypress-runner'

const CYPRESS_RESULTS_COLLECTION = 'cypressResults'

function cypressResultToFirestore(result: CypressResult): CypressResultDoc {
  const doc: CypressResultDoc = {
    runner: 'cypress',
    trigger: result.trigger,
    status: result.status ?? 'completed',
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

  if (result.error !== undefined) doc.error = result.error
  if (result.githubRepo !== undefined) doc.githubRepo = result.githubRepo
  if (result.githubRunId !== undefined) doc.githubRunId = result.githubRunId

  return doc
}

function cypressResultFromFirestore(
  docId: string,
  data: CypressResultDoc,
): CypressResult {
  return {
    id: docId,
    runner: data.runner ?? 'cypress',
    trigger: data.trigger,
    status: data.status ?? 'completed',
    projectId: data.projectId,
    projectName: data.projectName,
    success: data.success,
    totalTests: data.totalTests,
    passed: data.passed,
    failed: data.failed,
    skipped: data.skipped,
    duration: data.duration,
    specFiles: data.specFiles,
    output: data.output,
    error: data.error,
    githubRepo: data.githubRepo,
    githubRunId: data.githubRunId,
    timestamp: data.timestamp.toDate(),
  }
}

export interface SaveCypressResultInput {
  projectId: string
  projectName: string
  result: CypressRunResult
  trigger?: CypressTrigger
  githubRepo?: string
  githubRunId?: number
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
    trigger: input.trigger,
    status: 'completed',
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
    error: input.result.error,
    githubRepo: input.githubRepo,
    githubRunId: input.githubRunId,
    timestamp: now,
  }

  const docRef = getAdminDb().collection(CYPRESS_RESULTS_COLLECTION).doc()
  await docRef.set(
    cypressResultToFirestore({ ...cypressResult, id: docRef.id }),
  )

  return { ...cypressResult, id: docRef.id }
}

export interface SavePendingCypressResultInput {
  projectId: string
  projectName: string
  trigger?: CypressTrigger
  githubRepo: string
  githubRunId: number
  output: string
}

export async function savePendingCypressResult(
  input: SavePendingCypressResultInput,
): Promise<CypressResult> {
  const now = new Date()
  const cypressResult: CypressResult = {
    id: '',
    runner: 'cypress',
    trigger: input.trigger,
    status: 'pending',
    projectId: input.projectId,
    projectName: input.projectName,
    success: false,
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    specFiles: [],
    output: input.output,
    githubRepo: input.githubRepo,
    githubRunId: input.githubRunId,
    timestamp: now,
  }

  const docRef = getAdminDb().collection(CYPRESS_RESULTS_COLLECTION).doc()
  await docRef.set(
    cypressResultToFirestore({ ...cypressResult, id: docRef.id }),
  )

  return { ...cypressResult, id: docRef.id }
}

export async function completeCypressResult(
  resultId: string,
  result: CypressRunResult,
): Promise<boolean> {
  const update: Record<string, unknown> = {
    status: 'completed',
    success: result.success,
    totalTests: result.totalTests,
    passed: result.passed,
    failed: result.failed,
    skipped: result.skipped,
    duration: result.duration,
    specFiles: result.specFiles,
    output: result.output,
    timestamp: Timestamp.fromDate(new Date()),
  }
  if (result.error !== undefined) update.error = result.error

  const docRef = getAdminDb()
    .collection(CYPRESS_RESULTS_COLLECTION)
    .doc(resultId)

  return getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef)
    if (!snap.exists) return false

    const data = snap.data() as CypressResultDoc
    if ((data.status ?? 'completed') !== 'pending') return false

    tx.update(docRef, update)
    return true
  })
}

export async function getCypressResultById(
  resultId: string,
): Promise<CypressResult | null> {
  const snap = await getAdminDb()
    .collection(CYPRESS_RESULTS_COLLECTION)
    .doc(resultId)
    .get()

  if (!snap.exists) return null
  return cypressResultFromFirestore(snap.id, snap.data() as CypressResultDoc)
}

export async function getPendingCypressResults(): Promise<CypressResult[]> {
  const snapshot = await getAdminDb()
    .collection(CYPRESS_RESULTS_COLLECTION)
    .where('status', '==', 'pending')
    .get()

  return snapshot.docs.map((doc) =>
    cypressResultFromFirestore(doc.id, doc.data() as CypressResultDoc),
  )
}

export async function findPendingCypressResultByRun(
  githubRepo: string,
  githubRunId: number,
): Promise<CypressResult | null> {
  const snapshot = await getAdminDb()
    .collection(CYPRESS_RESULTS_COLLECTION)
    .where('status', '==', 'pending')
    .where('githubRepo', '==', githubRepo)
    .where('githubRunId', '==', githubRunId)
    .limit(1)
    .get()

  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return cypressResultFromFirestore(doc.id, doc.data() as CypressResultDoc)
}
