import { ApiError } from '@/shared/libs/api-response'

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}
