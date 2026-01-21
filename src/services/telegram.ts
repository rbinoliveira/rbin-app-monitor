import type { NotificationPayload } from '@/types'

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot'
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000

function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set')
  }
  return token
}

function getTelegramChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) {
    throw new Error('TELEGRAM_CHAT_ID environment variable is not set')
  }
  return chatId
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface SendMessageOptions {
  chatId?: string
  parseMode?: 'HTML' | 'Markdown'
  retries?: number
}

export interface SendMessageResult {
  success: boolean
  messageId?: number
  error?: string
}

export async function sendMessage(
  message: string,
  options?: SendMessageOptions,
): Promise<SendMessageResult> {
  const token = getTelegramBotToken()
  const chatId = options?.chatId ?? getTelegramChatId()
  const parseMode = options?.parseMode ?? 'HTML'
  const maxRetries = options?.retries ?? MAX_RETRIES

  const url = `${TELEGRAM_API_BASE_URL}${token}/sendMessage`

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.description ||
            `Telegram API error: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()

      if (data.ok && data.result) {
        return {
          success: true,
          messageId: data.result.message_id,
        }
      }

      throw new Error('Telegram API returned unexpected response format')
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to send message after retries',
  }
}

function formatHealthCheckFailedMessage(payload: NotificationPayload): string {
  return `<b>🚨 Health Check Failed</b>

<b>Project:</b> ${escapeHtml(payload.projectName)}
<b>Type:</b> ${escapeHtml(payload.details)}
<b>Time:</b> ${formatTimestamp(payload.timestamp)}

${escapeHtml(payload.details)}`
}

function formatHealthCheckRestoredMessage(
  payload: NotificationPayload,
): string {
  return `<b>✅ Health Check Restored</b>

<b>Project:</b> ${escapeHtml(payload.projectName)}
<b>Type:</b> ${escapeHtml(payload.details)}
<b>Time:</b> ${formatTimestamp(payload.timestamp)}

Service is now operational.`
}

function formatCypressFailedMessage(payload: NotificationPayload): string {
  const detailsContainsHtml =
    payload.details.includes('<b>') || payload.details.includes('<a href')

  return `<b>❌ Cypress Tests Failed</b>

<b>Project:</b> ${escapeHtml(payload.projectName)}
<b>Time:</b> ${formatTimestamp(payload.timestamp)}

${detailsContainsHtml ? payload.details : escapeHtml(payload.details)}`
}

function formatCypressPassedMessage(payload: NotificationPayload): string {
  return `<b>✅ Cypress Tests Passed</b>

<b>Project:</b> ${escapeHtml(payload.projectName)}
<b>Time:</b> ${formatTimestamp(payload.timestamp)}

All tests completed successfully.`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export async function sendNotification(
  payload: NotificationPayload,
  options?: SendMessageOptions,
): Promise<SendMessageResult> {
  let message: string

  switch (payload.type) {
    case 'health_check_failed':
      message = formatHealthCheckFailedMessage(payload)
      break
    case 'health_check_restored':
      message = formatHealthCheckRestoredMessage(payload)
      break
    case 'cypress_failed':
      message = formatCypressFailedMessage(payload)
      break
    case 'cypress_passed':
      message = formatCypressPassedMessage(payload)
      break
    default:
      throw new Error(`Unknown notification type: ${payload.type}`)
  }

  return sendMessage(message, { ...options, parseMode: 'HTML' })
}
