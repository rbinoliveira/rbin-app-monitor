import '@/shared/styles/globals.css'

import type { Metadata } from 'next'
import { Outfit, Space_Mono as SpaceMono } from 'next/font/google'

import { AppProvidersClient } from '@/features/platform/providers'
import { AppShell, GlassBackground } from '@/shared/components/layout'

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
    <html lang="pt-BR" className="dark">
      <body className={`${outfit.variable} ${spaceMono.variable}`}>
        <AppProvidersClient>
          <GlassBackground />
          <AppShell>{children}</AppShell>
        </AppProvidersClient>
      </body>
    </html>
  )
}
