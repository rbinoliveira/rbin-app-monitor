'use client'

import { cn } from '@/shared/libs/tw-merge'
import type { Project } from '@/shared/types/project.type'

export interface SummaryCardsProps {
  projects: Project[]
}

export function SummaryCards({ projects }: SummaryCardsProps) {
  const total = projects.length
  const active = projects.filter((p) => p.isActive).length
  const inactive = projects.filter((p) => !p.isActive).length

  const cards: {
    label: string
    value: number | string
    accent: string
  }[] = [
    { label: 'Total de apps', value: total, accent: 'text-cyan-300' },
    { label: 'Ativos', value: active, accent: 'text-emerald-300' },
    { label: 'Inativos', value: inactive, accent: 'text-slate-300' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="glass-surface rounded-[1.75rem] p-5">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400/80">
            {card.label}
          </p>
          <p
            className={cn(
              'mt-3 text-3xl font-semibold md:text-4xl',
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
