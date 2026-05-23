import { NextRequest } from 'next/server'

import {
  getAuthenticatedUser,
  requireFirebaseAuth,
} from '@/features/auth/libs/api-auth'
import {
  deleteUserGithubCredential,
  getUserGithubCredentialStatus,
  setUserGithubCredential,
} from '@/features/settings/services/user-github-credential'
import { withErrorHandling } from '@/shared/libs/api-response'
import type {
  SetUserGithubCredentialInput,
  UserGithubCredentialStatus,
} from '@/shared/types/user-credentials.type'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<UserGithubCredentialStatus>(async () => {
    return await getUserGithubCredentialStatus(user.id)
  })
}

export async function PUT(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<UserGithubCredentialStatus>(
    async () => {
      const body = (await request.json()) as SetUserGithubCredentialInput
      return await setUserGithubCredential(user.id, body.token)
    },
    { errorStatus: 400 },
  )
}

export async function DELETE(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<{ configured: false }>(async () => {
    await deleteUserGithubCredential(user.id)
    return { configured: false }
  })
}
