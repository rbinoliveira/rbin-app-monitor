'use client'

import { usePathname } from 'next/navigation'

import { useAuth } from '@/features/auth/hooks/authentication.hook'
import { appPublicRoutes } from '@/shared/constants/app-routes.constants'

import { Button } from './button'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isPublicRoute = appPublicRoutes.includes(pathname)

  return (
    <div className="page-shell min-h-screen">
      {!isPublicRoute && (
        <header className="app-header">
          <div className="app-header-inner glass-surface">
            <div className="app-header-brand">
              <div className="app-header-badge">RB</div>
              <div>
                <p className="app-header-title">RBIN Monitor</p>
                <p className="app-header-copy">
                  {user?.email ?? 'Painel de monitoramento de aplicações'}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={signOut}>
              Sair
            </Button>
          </div>
        </header>
      )}

      {children}
    </div>
  )
}
