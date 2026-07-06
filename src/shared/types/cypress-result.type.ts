import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export type CypressTrigger = 'manual' | 'cron'

export type CypressResultStatus = 'pending' | 'completed'

export interface CypressResult {
  id: string
  runner: 'cypress'
  trigger?: CypressTrigger
  status?: CypressResultStatus
  projectId: string
  projectName: string
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles: string[]
  output: string
  error?: string
  githubRepo?: string
  githubRunId?: number
  timestamp: Date
}

export interface CypressResultDoc {
  runner: 'cypress'
  trigger?: CypressTrigger
  status?: CypressResultStatus
  projectId: string
  projectName: string
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles: string[]
  output: string
  error?: string
  githubRepo?: string
  githubRunId?: number
  timestamp: FirestoreTimestamp
}
