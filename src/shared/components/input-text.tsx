'use client'

import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form'

import { cn } from '@/shared/libs/tw-merge'

export type InputTextProps<T extends FieldValues> = {
  name: Path<T>
  control: Control<T>
  defaultValue?: PathValue<T, Path<T>>
  label?: string
  placeholder?: string
  type?: 'text' | 'password' | 'email' | 'url'
  disabled?: boolean
  className?: string
}

export function InputText<T extends FieldValues>({
  name,
  control,
  defaultValue = '' as PathValue<T, Path<T>>,
  label,
  placeholder,
  type = 'text',
  disabled,
  className,
}: InputTextProps<T>) {
  const inputId =
    label
      ?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') ?? String(name)

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('w-full', className)}>
          {label && (
            <label
              htmlFor={inputId}
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/75"
            >
              {label}
            </label>
          )}
          <input
            {...field}
            id={inputId}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'glass-surface block h-12 w-full rounded-2xl px-4 text-sm text-white placeholder:text-slate-400/70 focus:border-cyan-300/40 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-cyan-400/20',
              error && 'border-rose-400/60 focus:ring-rose-400/20',
            )}
          />
          {error?.message && (
            <p className="mt-2 text-sm text-rose-300">{error.message}</p>
          )}
        </div>
      )}
    />
  )
}
