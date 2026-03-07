import '@/shared/styles/globals.css'

import type { Metadata } from 'next'
import { Outfit, Space_Mono as SpaceMono } from 'next/font/google'

import { AuthProvider } from '@/features/auth/contexts'
import { AppShell, GlassBackground } from '@/shared/components/layout'
import { ToastProvider } from '@/shared/components/ui/Toast'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const spaceMono = SpaceMono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'RBIN App Monitor',
  description:
    'Monitor application health, automate Playwright runs, and react to failures fast.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${spaceMono.variable}`}>
        <AuthProvider>
          <ToastProvider>
            <GlassBackground />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
