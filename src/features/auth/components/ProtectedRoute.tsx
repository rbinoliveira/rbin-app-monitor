'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@/features/auth'
import { appRoutes } from '@/shared/constants/app-routes.constant'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user && pathname !== appRoutes.signIn) {
      router.replace(appRoutes.signIn)
    }
  }, [loading, pathname, router, user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="glass-surface flex min-h-44 w-full max-w-md flex-col items-center justify-center rounded-[2rem] px-8 text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/35 border-t-cyan-300" />
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-300/80">
            Validando sessão
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
