'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth'
import { appRoutes } from '@/shared/constants/app-routes.constant'
import { Button } from '@/shared/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/shared/components/ui/Card'

function GoogleMark() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace(appRoutes.dashboard)
    }
  }, [loading, user, router])

  const handleSignIn = async () => {
    try {
      setError(null)
      setIsSigningIn(true)
      await signInWithGoogle()
    } catch {
      setError(
        'Falha ao entrar com Google. Verifique a configuração do Firebase e tente novamente.',
      )
      setIsSigningIn(false)
    }
  }

  const message = loading
    ? 'Validando sessão atual...'
    : user
      ? 'Redirecionando para o painel...'
      : 'Autentique com Google para acessar o painel de monitoramento.'

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="px-2">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-cyan-300/80">
              RBIN App Monitor
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Bem-vindo de volta
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300/80 sm:text-lg">
              Centralize disponibilidade do front, saúde do back e execução
              remota do Playwright em um único painel.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="glass-surface rounded-[1.5rem] p-4">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400/80">
                  Checagens
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Front + API
                </p>
              </div>
              <div className="glass-surface rounded-[1.5rem] p-4">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400/80">
                  Execuções
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Playwright em primeiro
                </p>
              </div>
              <div className="glass-surface rounded-[1.5rem] p-4">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400/80">
                  Armazenamento
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Histórico no Firebase
                </p>
              </div>
            </div>
          </section>

          <Card className="glass-surface-strong border-white/15 p-0">
            <CardContent className="p-8 sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-bold text-slate-950 shadow-[0_20px_40px_rgba(34,211,238,0.25)]">
                RB
              </div>
              <CardTitle className="mt-6 text-center text-3xl">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className="mt-2 text-center">
                {message}
              </CardDescription>

              <div className="mt-8">
                <Button
                  onClick={handleSignIn}
                  loading={isSigningIn}
                  disabled={isSigningIn || loading || Boolean(user)}
                  size="lg"
                  className="w-full"
                >
                  <GoogleMark />
                  {isSigningIn ? 'Entrando...' : 'Entrar com Google'}
                </Button>
              </div>

              {error && (
                <div className="mt-4 rounded-[1.25rem] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-slate-950/28 p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-slate-400/75">
                  Acesso apenas com Google
                </p>
                <p className="mt-2 text-sm text-slate-300/80">
                  Login por e-mail/senha, Apple e GitHub foi removido. O acesso
                  é feito apenas pela autenticação Google do Firebase.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
