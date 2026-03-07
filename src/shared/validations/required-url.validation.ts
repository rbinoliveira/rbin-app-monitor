import { z } from 'zod'

import { notEmpty } from '@/shared/validations/required-string.validation'
import { ValidationError } from '@/shared/validations/validation-error.validation'

const urlSchema = z.string().url()

export function isValidUrl(value: string, fieldName: string): string {
  notEmpty(value, fieldName)
  const result = urlSchema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(`${fieldName} must be a valid URL`, fieldName)
  }
  return value
}
