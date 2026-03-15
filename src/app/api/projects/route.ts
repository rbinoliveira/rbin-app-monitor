import { NextRequest } from 'next/server'

import {
  getAuthenticatedUser,
  requireFirebaseAuth,
} from '@/features/auth/libs/api-auth'
import {
  createProject,
  getAllProjects,
} from '@/features/projects/services/projects'
import { withErrorHandling } from '@/shared/libs/api-response'
import type { CreateProjectInput, Project } from '@/shared/types/project.type'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<Project[]>(async () => {
    return await getAllProjects(user.id)
  })
}

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<Project>(
    async () => {
      const body: CreateProjectInput = await request.json()
      return await createProject(body, user.id)
    },
    { successStatus: 201, errorStatus: 400 },
  )
}
