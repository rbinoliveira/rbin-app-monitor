import type { CypressRunResult } from './cypress-runner'

const DEFAULT_TIMEOUT_MS = 120000

interface RemoteCypressResponse {
  success?: boolean
  passed?: number
  failed?: number
  totalTests?: number
  skipped?: number
  duration?: number
  output?: string
  specFiles?: string[]
  error?: string
}

function normalizeRemoteResponse(
  data: RemoteCypressResponse,
  success: boolean,
): CypressRunResult {
  const passed = Number(data.passed) || 0
  const failed = Number(data.failed) || 0
  const skipped = Number(data.skipped) || 0
  const totalTests = Number(data.totalTests) || passed + failed + skipped
  const duration = Number(data.duration) || 0
  const output = typeof data.output === 'string' ? data.output : ''
  const specFiles = Array.isArray(data.specFiles) ? data.specFiles : []

  return {
    success: success && (data.success !== false) && failed === 0,
    totalTests,
    passed,
    failed,
    skipped,
    duration,
    specFiles,
    output,
    error: data.error,
  }
}

export async function callRemoteCypressRun(
  url: string,
  options?: { timeout?: number },
): Promise<CypressRunResult> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const text = await response.text()
    let data: RemoteCypressResponse = {}
    try {
      data = JSON.parse(text) as RemoteCypressResponse
    } catch {
      return normalizeRemoteResponse(
        { success: false, error: 'Invalid JSON response' },
        false,
      )
    }

    return normalizeRemoteResponse(data, response.ok)
  } catch (error) {
    clearTimeout(timeoutId)
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return normalizeRemoteResponse(
      {
        success: false,
        error: message,
        passed: 0,
        failed: 0,
        totalTests: 0,
        skipped: 0,
        duration: 0,
        output: '',
        specFiles: [],
      },
      false,
    )
  }
}
