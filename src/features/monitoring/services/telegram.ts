import type { NotificationPayload } from '@/shared/types/notification.type'

export interface TelegramCredentials {
  botToken: string
  chatId: string
}

function formatMessage(payload: NotificationPayload): string {
  const time = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(payload.timestamp)

  switch (payload.type) {
    case 'cypress_failed':
      return `🔴 <b>Cypress falhou</b>\n<b>Projeto:</b> ${payload.projectName}\n<b>Horário:</b> ${time}\n${payload.details}`
    case 'cypress_passed':
      return `✅ <b>Cypress passou</b>\n<b>Projeto:</b> ${payload.projectName}\n<b>Horário:</b> ${time}\nTodos os testes passaram.`
    default:
      return `📢 <b>${payload.projectName}</b>\n${payload.details}`
  }
}

export async function sendTelegramNotification(
  payload: NotificationPayload,
  credentials: TelegramCredentials | null,
): Promise<void> {
  if (!credentials) return

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${credentials.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: credentials.chatId,
          text: formatMessage(payload),
          parse_mode: 'HTML',
        }),
      },
    )
    if (!res.ok) {
      const body = await res.text()
      console.error(`Telegram API error ${res.status}: ${body}`)
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
  }
}
