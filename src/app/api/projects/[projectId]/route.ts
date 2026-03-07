import { NextRequest } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/lib/api-auth'
import { updateProject } from '@/features/projects/services/projects'
import { withErrorHandling } from '@/shared/lib/api-response'
import type { Project, UpdateProjectInput } from '@/shared/types/project.type'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  return withErrorHandling<Project>(
    async () => {
      const body: UpdateProjectInput = await request.json()
      const { projectId } = await context.params
      return await updateProject(projectId, body)
    },
    { errorStatus: 400 },
  )
}
