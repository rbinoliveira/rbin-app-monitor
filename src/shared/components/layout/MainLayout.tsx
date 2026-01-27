'use client'

import { type ReactNode } from 'react'

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { ToastProvider } from '@/shared/components/ui'

import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="lg:pl-64">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </ProtectedRoute>
  )
}
