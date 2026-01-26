import './globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/contexts'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RBIN App Monitor',
  description:
    'Monitor your applications health, run Cypress tests and receive Telegram notifications',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
