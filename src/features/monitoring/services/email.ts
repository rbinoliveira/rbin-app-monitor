import nodemailer from 'nodemailer'
import { Resend } from 'resend'

import type { NotificationPayload } from '@/shared/types'

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000

function useResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(apiKey)
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true'

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP_HOST, SMTP_USER and SMTP_PASS environment variables are required',
    )
  }

  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : secure ? 465 : 587,
    secure,
    auth: { user, pass },
  })
}

function getNotificationTo(): string {
  const to = process.env.NOTIFICATION_EMAIL_TO
  if (!to) {
    throw new Error('NOTIFICATION_EMAIL_TO environment variable is not set')
  }
  return to
}

function getNotificationFrom(): string {
  const from = process.env.NOTIFICATION_EMAIL_FROM
  if (from) return from
  if (useResend()) {
    return process.env.RESEND_FROM || 'App Monitor <onboarding@resend.dev>'
  }
  return process.env.SMTP_USER || 'noreply@app-monitor.local'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

function formatSubject(payload: NotificationPayload): string {
  const time = formatTimestamp(payload.timestamp)
  switch (payload.type) {
    case 'health_check_failed':
      return `[App Monitor] Health check failed: ${payload.projectName} - ${time}`
    case 'health_check_restored':
      return `[App Monitor] Health check restored: ${payload.projectName} - ${time}`
    case 'cypress_failed':
      return `[App Monitor] Cypress tests failed: ${payload.projectName} - ${time}`
    case 'cypress_passed':
      return `[App Monitor] Cypress tests passed: ${payload.projectName} - ${time}`
    default:
      return `[App Monitor] Notification - ${payload.projectName}`
  }
}

function formatHtml(payload: NotificationPayload): string {
  const time = formatTimestamp(payload.timestamp)
  const detailsSafe = escapeHtml(payload.details).replace(/\n/g, '<br>')

  switch (payload.type) {
    case 'health_check_failed':
      return `<h2>Health check failed</h2>
<p><strong>Project:</strong> ${escapeHtml(payload.projectName)}<br>
<strong>Time:</strong> ${time}</p>
<p>${detailsSafe}</p>`
    case 'health_check_restored':
      return `<h2>Health check restored</h2>
<p><strong>Project:</strong> ${escapeHtml(payload.projectName)}<br>
<strong>Time:</strong> ${time}</p>
<p>Service is now operational.</p>`
    case 'cypress_failed':
      return `<h2>Cypress tests failed</h2>
<p><strong>Project:</strong> ${escapeHtml(payload.projectName)}<br>
<strong>Time:</strong> ${time}</p>
<p>${payload.details.includes('<') ? payload.details.replace(/\n/g, '<br>') : detailsSafe}</p>`
    case 'cypress_passed':
      return `<h2>Cypress tests passed</h2>
<p><strong>Project:</strong> ${escapeHtml(payload.projectName)}<br>
<strong>Time:</strong> ${time}</p>
<p>All tests completed successfully.</p>`
    default:
      return `<p>${detailsSafe}</p>`
  }
}

function formatText(payload: NotificationPayload): string {
  const time = formatTimestamp(payload.timestamp)
  return `Project: ${payload.projectName}\nTime: ${time}\n\n${payload.details}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface SendNotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

async function sendViaResend(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string,
): Promise<SendNotificationResult> {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return {
    success: true,
    messageId: data?.id,
  }
}

async function sendViaSmtp(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string,
): Promise<SendNotificationResult> {
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
  return {
    success: true,
    messageId: info.messageId,
  }
}

export async function sendNotification(
  payload: NotificationPayload,
  options?: { to?: string },
): Promise<SendNotificationResult> {
  const to = options?.to ?? getNotificationTo()
  const from = getNotificationFrom()
  const subject = formatSubject(payload)
  const html = formatHtml(payload)
  const text = formatText(payload)

  let lastError: string | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = useResend()
        ? await sendViaResend(to, from, subject, html, text)
        : await sendViaSmtp(to, from, subject, html, text)

      if (result.success) return result
      lastError = result.error ?? null
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
    }

    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError || 'Failed to send email after retries',
  }
}
