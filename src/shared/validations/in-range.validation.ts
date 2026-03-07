import { z } from 'zod'

import { required } from '@/shared/validations/required-string.validation'
import { ValidationError } from '@/shared/validations/validation-error.validation'

export function inRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): number {
  required(value, fieldName)
  const result = z.number().min(min).max(max).safeParse(value)
  if (!result.success) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}`,
      fieldName,
    )
  }
  return value
}
