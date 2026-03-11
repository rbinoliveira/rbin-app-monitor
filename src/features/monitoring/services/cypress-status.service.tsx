'use client'

import { useQuery } from '@tanstack/react-query'

async function getCypressStatus(projectId: string): Promise<boolean> {
  const res = await fetch(`/api/cypress/status?projectId=${projectId}`, {
    credentials: 'include',
  })
  if (!res.ok) return false
  const json = await res.json()
  return json.data?.running ?? false
}

export function useCypressStatusService(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['cypress-status', projectId],
    queryFn: () => getCypressStatus(projectId),
    refetchInterval: (query) => (query.state.data ? 3000 : false),
    enabled,
  })
}
