import { NextRequest } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/lib/api-auth'
import {
  createProject,
  getAllProjects,
} from '@/features/projects/services/projects'
import { withErrorHandling } from '@/shared/lib/api-response'
import type { CreateProjectInput, Project } from '@/shared/types'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  return withErrorHandling<Project[]>(async () => {
    return await getAllProjects()
  })
}

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  return withErrorHandling<Project>(
    async () => {
      const body: CreateProjectInput = await request.json()
      return await createProject(body)
    },
    { successStatus: 201, errorStatus: 400 },
  )
}
