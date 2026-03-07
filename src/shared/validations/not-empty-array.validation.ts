import { ValidationError } from '@/shared/validations/validation-error.validation'
import { required } from '@/shared/validations/required-string.validation'

export function notEmptyArray<T>(value: T[], fieldName: string): T[] {
  required(value, fieldName)
  if (value.length === 0) {
    throw new ValidationError(`${fieldName} must not be empty`, fieldName)
  }
  return value
}
