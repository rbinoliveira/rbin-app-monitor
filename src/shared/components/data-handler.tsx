'use client'

import { ReactNode } from 'react'

export interface DataHandlerProps {
  isLoading: boolean
  isError: boolean
  error?: string | null
  children: ReactNode
  skeleton?: ReactNode
  onRetry?: () => void
}

function DefaultSkeleton() {
  return (
    <div className="glass-surface rounded-[1.75rem] p-8 text-center text-slate-300/80">
      <div className="mx-auto h-6 w-48 animate-pulse rounded bg-slate-500/30" />
      <p className="mt-4 text-sm">Carregando...</p>
    </div>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  error?: string | null
  onRetry?: () => void
}) {
  return (
    <div className="glass-surface rounded-[1.75rem] border-rose-400/25 p-5 text-rose-200">
      <p>{error ?? 'Ocorreu um erro ao carregar os dados.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm underline focus:outline-none focus:ring-2 focus:ring-rose-400/50"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function DataHandler({
  isLoading,
  isError,
  error = null,
  children,
  skeleton,
  onRetry,
}: DataHandlerProps) {
  if (isLoading) {
    return <>{skeleton ?? <DefaultSkeleton />}</>
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  return <>{children}</>
}
