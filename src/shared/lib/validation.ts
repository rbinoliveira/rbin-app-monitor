import { ApiError } from './api-response'

/**
 * Validation error class
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * Validate that a value is not null or undefined
 */
export function required<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return value
}

/**
 * Validate that a string is not empty
 */
export function notEmpty(value: string, fieldName: string): string {
  required(value, fieldName)
  if (value.trim() === '') {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName)
  }
  return value
}

/**
 * Validate that a value is a valid URL
 */
export function isValidUrl(value: string, fieldName: string): string {
  notEmpty(value, fieldName)
  try {
    // eslint-disable-next-line no-new
    new URL(value)
    return value
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`, fieldName)
  }
}

/**
 * Validate that an array is not empty
 */
export function notEmptyArray<T>(value: T[], fieldName: string): T[] {
  required(value, fieldName)
  if (value.length === 0) {
    throw new ValidationError(`${fieldName} must not be empty`, fieldName)
  }
  return value
}

/**
 * Validate that a value is one of the allowed values
 */
export function oneOf<T>(value: T, allowed: T[], fieldName: string): T {
  required(value, fieldName)
  if (!allowed.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowed.join(', ')}`,
      fieldName,
    )
  }
  return value
}

/**
 * Validate that a number is within a range
 */
export function inRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): number {
  required(value, fieldName)
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}`,
      fieldName,
    )
  }
  return value
}

/**
 * Validate an object against a schema
 */
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
