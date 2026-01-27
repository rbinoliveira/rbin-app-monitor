import { NextRequest } from 'next/server'

import { checkWebPage } from '@/features/monitoring/services/health-check'
import { withErrorHandling } from '@/shared/lib/api-response'
import { inRange, isValidUrl, required } from '@/shared/lib/validation'
import type { HealthCheckResponse } from '@/shared/types'

export async function GET(request: NextRequest) {
  return withErrorHandling<HealthCheckResponse>(
    async () => {
      const searchParams = request.nextUrl.searchParams

      const url = isValidUrl(required(searchParams.get('url'), 'url'), 'url')

      const options: {
        timeout?: number
        expectedStatus?: number
      } = {}

      const timeoutParam = searchParams.get('timeout')
      if (timeoutParam) {
        const timeout = parseInt(timeoutParam, 10)
        if (isNaN(timeout)) {
          throw new Error('Timeout must be a number')
        }
        options.timeout = inRange(timeout, 1, 300000, 'timeout')
      }

      const expectedStatusParam = searchParams.get('expectedStatus')
      if (expectedStatusParam) {
        const expectedStatus = parseInt(expectedStatusParam, 10)
        if (isNaN(expectedStatus)) {
          throw new Error('Expected status must be a number')
        }
        options.expectedStatus = inRange(
          expectedStatus,
          100,
          599,
          'expectedStatus',
        )
      }

      return await checkWebPage(url, options)
    },
    { errorStatus: 400 },
  )
}
