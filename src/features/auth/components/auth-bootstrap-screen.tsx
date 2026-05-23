'use client'

import { LoaderCircle } from 'lucide-react'

export function AuthBootstrapScreen() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6">
      <div className="glass-surface-strong relative w-full max-w-md overflow-hidden rounded-[2rem] px-8 py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-bold text-slate-950 shadow-[0_20px_40px_rgba(34,211,238,0.25)]">
          RB
        </div>

        <p className="mt-6 font-mono text-[0.72rem] uppercase tracking-[0.26em] text-cyan-300/80">
          RBIN App Monitor
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Carregando sua sessão
        </h1>

        <div className="mt-7 flex items-center justify-center gap-3 text-slate-300/80">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Validando acesso...</span>
        </div>
      </div>
    </main>
  )
}
