'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/shared/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        'bg-gradient-to-r from-cyan-500 via-cyan-400 to-violet-500 text-slate-950 shadow-[0_12px_35px_rgba(34,211,238,0.35)] hover:brightness-110',
      secondary:
        'glass-surface text-white hover:border-white/25 hover:bg-white/10',
      danger:
        'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[0_12px_28px_rgba(244,63,94,0.28)] hover:brightness-110',
      ghost:
        'border border-white/10 bg-transparent text-slate-200 hover:bg-white/8 hover:text-white',
    }

    const sizes = {
      sm: 'h-9 rounded-xl px-3.5 text-xs font-semibold uppercase tracking-[0.14em]',
      md: 'h-11 rounded-2xl px-4.5 text-sm font-semibold',
      lg: 'h-13 rounded-2xl px-6 text-sm font-semibold uppercase tracking-[0.18em]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:ring-offset-0 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
