export interface RunHealthCheckResult {
  success: boolean
}

export async function runHealthCheckUseCase(
  projectId: string,
): Promise<RunHealthCheckResult> {
  const response = await fetch('/api/health-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ projectId }),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Health Check falhou')
  }

  return { success: true }
}
