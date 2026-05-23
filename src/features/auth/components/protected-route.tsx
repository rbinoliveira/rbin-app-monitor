'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { AuthBootstrapScreen } from '@/features/auth/components/auth-bootstrap-screen'
import { useAuth } from '@/features/auth/hooks/authentication.hook'
import { appRoutes } from '@/shared/constants/app-routes.constants'

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
    return <AuthBootstrapScreen />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
