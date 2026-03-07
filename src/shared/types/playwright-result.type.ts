import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export interface PlaywrightResult {
  id: string
  runner: 'playwright'
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
  resourceUsage?: {
    maxMemoryMB: number
    avgCpu: number
  }
  timestamp: Date
}

export interface PlaywrightResultDoc {
  runner: 'playwright'
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
  resourceUsage?: {
    maxMemoryMB: number
    avgCpu: number
  }
  timestamp: FirestoreTimestamp
}
