import { ValidationError } from '@/shared/validations/validation-error.validation'

export function validateObject<T extends Record<string, unknown>>(
  obj: unknown,
  validators: {
    [K in keyof T]: (value: unknown) => T[K]
  },
): T {
  if (typeof obj !== 'object' || obj === null) {
    throw new ValidationError('Invalid object')
  }

  const result = {} as T
  const data = obj as Record<string, unknown>

  for (const key in validators) {
    result[key] = validators[key](data[key])
  }

  return result
}
