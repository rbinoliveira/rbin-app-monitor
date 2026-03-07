export interface CypressRunResult {
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles: string[]
  output: string
  error?: string
}
