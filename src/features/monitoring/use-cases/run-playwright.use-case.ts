export interface RunPlaywrightResult {
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles?: string[]
  output?: string
  error?: string
}

export async function runPlaywrightUseCase(
  projectId: string,
): Promise<RunPlaywrightResult> {
  const response = await fetch('/api/playwright/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ projectId }),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Falha ao executar Playwright')
  }

  const data = result.data ?? {}
  return {
    success: data.success ?? result.success,
    totalTests: data.totalTests ?? 0,
    passed: data.passed ?? 0,
    failed: data.failed ?? 0,
    skipped: data.skipped ?? 0,
    duration: data.duration ?? 0,
    specFiles: data.specFiles,
    output: data.output,
    error: data.error,
  }
}
