import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export interface UserGithubCredentialDoc {
  userId: string
  githubUsername: string
  encryptedToken: string
  updatedAt: FirestoreTimestamp
}

export interface UserGithubCredentialStatus {
  configured: boolean
  githubUsername: string | null
  updatedAt: Date | null
}

export interface SetUserGithubCredentialInput {
  token: string
}

export interface UserTelegramCredentialDoc {
  userId: string
  botUsername: string
  encryptedBotToken: string
  chatId: string
  updatedAt: FirestoreTimestamp
}

export interface UserTelegramCredentialStatus {
  configured: boolean
  botUsername: string | null
  chatId: string | null
  updatedAt: Date | null
}

export interface SetUserTelegramCredentialInput {
  botToken: string
  chatId: string
}
