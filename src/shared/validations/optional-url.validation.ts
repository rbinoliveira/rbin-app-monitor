import { z } from 'zod'

import { ValidationError } from '@/shared/validations/validation-error.validation'

const urlSchema = z.string().url()

export function optionalUrl(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  if (trimmed === '') return null
  const result = urlSchema.safeParse(trimmed)
  if (!result.success) {
    throw new ValidationError('Must be a valid URL', fieldName)
  }
  return trimmed
}
