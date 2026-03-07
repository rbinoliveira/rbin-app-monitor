'use client'

import { ReactNode } from 'react'

import { AuthProvider } from '@/features/auth/contexts'
import { ToastProvider } from '@/shared/components/ui/Toast'
import { ReactQueryProvider } from '@/shared/providers/react-query-provider'

export function AppProvidersClient({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ReactQueryProvider>
  )
}
