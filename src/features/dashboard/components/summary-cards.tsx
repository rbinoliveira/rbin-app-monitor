'use client'

import { cn } from '@/shared/lib/utils'
import type { Project } from '@/shared/types/project.type'

export interface SummaryCardsProps {
  projects: Project[]
}

export function SummaryCards({ projects }: SummaryCardsProps) {
  const total = projects.length
  const healthy = projects.filter((p) => p.status === 'healthy').length
  const unhealthy = projects.filter((p) => p.status === 'unhealthy').length
  const lastCheck = projects
    .map((p) => p.lastCheckAt)
    .filter(Boolean)
    .sort((a, b) => (b! > a! ? 1 : -1))[0]

  const cards: {
    label: string
    value: number | string
    accent: string
    compact?: boolean
  }[] = [
    { label: 'Total de apps', value: total, accent: 'text-cyan-300' },
    { label: 'Saudáveis', value: healthy, accent: 'text-emerald-300' },
    { label: 'Com falha', value: unhealthy, accent: 'text-rose-300' },
    {
      label: 'Última checagem',
      value: lastCheck ? new Date(lastCheck).toLocaleTimeString() : '—',
      accent: 'text-violet-300',
      compact: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-surface rounded-[1.75rem] p-5">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400/80">
            {card.label}
          </p>
          <p
            className={cn(
              'mt-3 font-semibold',
              card.compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl',
              card.accent,
            )}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
