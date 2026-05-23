import { Timestamp } from 'firebase-admin/firestore'

import type { TelegramCredentials } from '@/features/monitoring/services/telegram'
import { ApiError } from '@/shared/libs/api-response'
import { COLLECTION_NAMES, HTTP_STATUS } from '@/shared/libs/constants'
import { decryptSecret, encryptSecret } from '@/shared/libs/crypto'
import { getAdminDb } from '@/shared/libs/firebase-admin'
import type {
  UserTelegramCredentialDoc,
  UserTelegramCredentialStatus,
} from '@/shared/types/user-credentials.type'

const COLLECTION = COLLECTION_NAMES.USER_TELEGRAM_CREDENTIALS

interface TelegramApiResponse<T> {
  ok: boolean
  result?: T
  description?: string
}

interface TelegramBotResponse {
  username?: string
}

async function fetchTelegramBotUsername(botToken: string): Promise<string> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getMe`,
  )
  const data = (await response.json().catch(() => ({}))) as TelegramApiResponse<
    TelegramBotResponse
  >

  if (!response.ok || !data.ok || !data.result?.username) {
    throw new ApiError(
      data.description ?? 'Telegram rejected the provided bot token.',
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  return data.result.username
}

async function validateTelegramChat(
  botToken: string,
  chatId: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(chatId)}`,
  )
  const data = (await response.json().catch(() => ({}))) as TelegramApiResponse<
    unknown
  >

  if (!response.ok || !data.ok) {
    throw new ApiError(
      data.description ??
        'Telegram could not access this chat. Send a message to the bot before saving.',
      HTTP_STATUS.BAD_REQUEST,
    )
  }
}

export async function getUserTelegramCredentialStatus(
  userId: string,
): Promise<UserTelegramCredentialStatus> {
  const snap = await getAdminDb().collection(COLLECTION).doc(userId).get()

  if (!snap.exists) {
    return {
      configured: false,
      botUsername: null,
      chatId: null,
      updatedAt: null,
    }
  }

  const data = snap.data() as UserTelegramCredentialDoc
  return {
    configured: true,
    botUsername: data.botUsername,
    chatId: data.chatId,
    updatedAt: data.updatedAt.toDate(),
  }
}

export async function getUserTelegramCredentials(
  userId: string,
): Promise<TelegramCredentials | null> {
  const snap = await getAdminDb().collection(COLLECTION).doc(userId).get()
  if (!snap.exists) return null

  const data = snap.data() as UserTelegramCredentialDoc
  return {
    botToken: decryptSecret(data.encryptedBotToken),
    chatId: data.chatId,
  }
}

export async function setUserTelegramCredential(
  userId: string,
  botToken: string,
  chatId: string,
): Promise<UserTelegramCredentialStatus> {
  const trimmedBotToken = botToken.trim()
  const trimmedChatId = chatId.trim()

  if (!trimmedBotToken || !trimmedChatId) {
    throw new ApiError(
      'Bot token and chat ID are required',
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  const botUsername = await fetchTelegramBotUsername(trimmedBotToken)
  await validateTelegramChat(trimmedBotToken, trimmedChatId)

  const updatedAt = Timestamp.fromDate(new Date())
  const doc: UserTelegramCredentialDoc = {
    userId,
    botUsername,
    encryptedBotToken: encryptSecret(trimmedBotToken),
    chatId: trimmedChatId,
    updatedAt,
  }

  await getAdminDb().collection(COLLECTION).doc(userId).set(doc)

  return {
    configured: true,
    botUsername,
    chatId: trimmedChatId,
    updatedAt: updatedAt.toDate(),
  }
}

export async function deleteUserTelegramCredential(
  userId: string,
): Promise<void> {
  await getAdminDb().collection(COLLECTION).doc(userId).delete()
}
