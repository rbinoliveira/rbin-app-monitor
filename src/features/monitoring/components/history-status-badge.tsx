'use client'

import { cn } from '@/shared/lib/utils'

export interface HistoryStatusBadgeProps {
  success: boolean
  label: string
}

export function HistoryStatusBadge({ success, label }: HistoryStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
        success ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800',
      )}
    >
      {label}
    </span>
  )
}
