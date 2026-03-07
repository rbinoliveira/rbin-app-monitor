import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export interface CypressResult {
  id: string
  runner: 'cypress'
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
  timestamp: Date
}

export interface CypressResultDoc {
  runner: 'cypress'
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
  timestamp: FirestoreTimestamp
}
