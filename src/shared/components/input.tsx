'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/shared/libs/tw-merge'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/75"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'glass-surface block h-12 w-full rounded-2xl px-4 text-sm text-white placeholder:text-slate-400/70 focus:border-cyan-300/40 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-cyan-400/20',
            error ? 'border-rose-400/60 focus:ring-rose-400/20' : '',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        {hint && !error && (
          <p className="mt-2 text-sm text-slate-400/80">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
