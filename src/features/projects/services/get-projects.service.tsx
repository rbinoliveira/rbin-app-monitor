'use client'

import { useQuery } from '@tanstack/react-query'

import { getProjectsUseCase } from '@/features/projects/use-cases/get-projects.use-case'
import { REFRESH_INTERVAL } from '@/shared/libs/constants'

export const getProjectsQueryKey = ['projects']

export function useGetProjectsService() {
  return useQuery({
    queryKey: getProjectsQueryKey,
    queryFn: getProjectsUseCase,
    refetchInterval: REFRESH_INTERVAL.PROJECTS_LIST,
  })
}
