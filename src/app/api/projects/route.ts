import { NextRequest } from 'next/server'

import {
  createProject,
  getAllProjects,
} from '@/features/projects/services/projects'
import { withErrorHandling } from '@/shared/lib/api-response'
import type { CreateProjectInput, Project } from '@/shared/types'

export async function GET(_request: NextRequest) {
  return withErrorHandling<Project[]>(async () => {
    return await getAllProjects()
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandling<Project>(
    async () => {
      const body: CreateProjectInput = await request.json()
      return await createProject(body)
    },
    { successStatus: 201, errorStatus: 400 },
  )
}
