import type { NotificationPayload } from '@/shared/types/notification.type'

function isTelegramEnabled(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  )
}

function formatMessage(payload: NotificationPayload): string {
  const time = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
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
): Promise<void> {
  if (!isTelegramEnabled()) return

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatMessage(payload),
        parse_mode: 'HTML',
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`Telegram API error ${res.status}: ${body}`)
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
  }
}
