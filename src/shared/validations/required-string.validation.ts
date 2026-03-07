import { z } from 'zod'

import { ValidationError } from '@/shared/validations/validation-error.validation'

export function required<T>(value: T | null | undefined, fieldName: string): T {
  const result = z.unknown().refine((v) => v !== null && v !== undefined).safeParse(value)
  if (!result.success) {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return value as T
}

export function notEmpty(value: string, fieldName: string): string {
  required(value, fieldName)
  const result = z.string().min(1).safeParse(value.trim())
  if (!result.success) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName)
  }
  return value
}
