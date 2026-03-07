import { z } from 'zod'

import { required } from '@/shared/validations/required-string.validation'
import { ValidationError } from '@/shared/validations/validation-error.validation'

export function oneOf<T>(value: T, allowed: T[], fieldName: string): T {
  required(value, fieldName)
  const result = z.custom<T>((v) => allowed.includes(v as T)).safeParse(value)
  if (!result.success) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowed.join(', ')}`,
      fieldName,
    )
  }
  return value
}
