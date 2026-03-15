'use client'

import { type ReactNode } from 'react'

import { cn } from '@/shared/libs/tw-merge'

interface TooltipProps {
  label: string
  children: ReactNode
  className?: string
}

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 scale-90 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
        <div className="whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md">
          {label}
        </div>
        <div className="absolute -bottom-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-slate-900/95" />
      </div>
    </div>
  )
}
