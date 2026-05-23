import { NextRequest } from 'next/server'

import {
  getAuthenticatedUser,
  requireFirebaseAuth,
} from '@/features/auth/libs/api-auth'
import {
  deleteUserTelegramCredential,
  getUserTelegramCredentialStatus,
  setUserTelegramCredential,
} from '@/features/settings/services/user-telegram-credential'
import { withErrorHandling } from '@/shared/libs/api-response'
import type {
  SetUserTelegramCredentialInput,
  UserTelegramCredentialStatus,
} from '@/shared/types/user-credentials.type'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<UserTelegramCredentialStatus>(async () => {
    return await getUserTelegramCredentialStatus(user.id)
  })
}

export async function PUT(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<UserTelegramCredentialStatus>(
    async () => {
      const body = (await request.json()) as SetUserTelegramCredentialInput
      return await setUserTelegramCredential(
        user.id,
        body.botToken,
        body.chatId,
      )
    },
    { errorStatus: 400 },
  )
}

export async function DELETE(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!

  return withErrorHandling<{ configured: false }>(async () => {
    await deleteUserTelegramCredential(user.id)
    return { configured: false }
  })
}
