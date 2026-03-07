import { Timestamp } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/lib/api-auth'
import { COLLECTION_NAMES } from '@/shared/lib/constants'
import { getAdminDb } from '@/shared/lib/firebase-admin'
import type { ApiResponse } from '@/shared/types/api-response.type'
import type { CypressResult, CypressResultDoc } from '@/shared/types/cypress-result.type'
import type {
  HealthCheckResult,
  HealthCheckResultDoc,
} from '@/shared/types/health-check.type'
import type {
  PlaywrightResult,
  PlaywrightResultDoc,
} from '@/shared/types/playwright-result.type'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const results: (HealthCheckResult | CypressResult | PlaywrightResult)[] = []
    const limit = pageSize
    const offset = (page - 1) * pageSize

    let healthCheckQuery = getAdminDb()
      .collection(COLLECTION_NAMES.HEALTH_CHECK_RESULTS)
      .orderBy('timestamp', 'desc')

    let cypressQuery = getAdminDb()
      .collection(COLLECTION_NAMES.CYPRESS_RESULTS)
      .orderBy('timestamp', 'desc')

    let playwrightQuery = getAdminDb()
      .collection(COLLECTION_NAMES.PLAYWRIGHT_RESULTS)
      .orderBy('timestamp', 'desc')

    if (projectId) {
      healthCheckQuery = healthCheckQuery.where('projectId', '==', projectId)
      cypressQuery = cypressQuery.where('projectId', '==', projectId)
      playwrightQuery = playwrightQuery.where('projectId', '==', projectId)
    }

    if (type === 'health_check' || !type) {
      if (startDate) {
        const start = new Date(startDate)
        healthCheckQuery = healthCheckQuery.where(
          'timestamp',
          '>=',
          Timestamp.fromDate(start),
        )
      }

      if (endDate) {
        const end = new Date(endDate)
        healthCheckQuery = healthCheckQuery.where(
          'timestamp',
          '<=',
          Timestamp.fromDate(end),
        )
      }

      const healthSnapshot = await healthCheckQuery.limit(limit + offset).get()
      const healthDocs = healthSnapshot.docs.slice(offset).map((doc) => {
        const data = doc.data() as HealthCheckResultDoc
        return {
          id: doc.id,
          projectId: data.projectId,
          projectName: data.projectName,
          type: data.type,
          url: data.url,
          success: data.success,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          errorMessage: data.errorMessage,
          timestamp: data.timestamp.toDate(),
        } as HealthCheckResult
      })
      results.push(...healthDocs)
    }

    if (type === 'cypress' || !type) {
      if (startDate) {
        const start = new Date(startDate)
        cypressQuery = cypressQuery.where(
          'timestamp',
          '>=',
          Timestamp.fromDate(start),
        )
      }

      if (endDate) {
        const end = new Date(endDate)
        cypressQuery = cypressQuery.where(
          'timestamp',
          '<=',
          Timestamp.fromDate(end),
        )
      }

      const cypressSnapshot = await cypressQuery.limit(limit + offset).get()
      const cypressDocs = cypressSnapshot.docs.slice(offset).map((doc) => {
        const data = doc.data() as CypressResultDoc
        return {
          id: doc.id,
          runner: data.runner ?? 'cypress',
          projectId: data.projectId,
          projectName: data.projectName,
          success: data.success,
          totalTests: data.totalTests,
          passed: data.passed,
          failed: data.failed,
          skipped: data.skipped,
          duration: data.duration,
          specFiles: data.specFiles,
          output: data.output,
          timestamp: data.timestamp.toDate(),
        } as CypressResult
      })
      results.push(...cypressDocs)
    }

    if (type === 'playwright' || !type) {
      if (startDate) {
        const start = new Date(startDate)
        playwrightQuery = playwrightQuery.where(
          'timestamp',
          '>=',
          Timestamp.fromDate(start),
        )
      }

      if (endDate) {
        const end = new Date(endDate)
        playwrightQuery = playwrightQuery.where(
          'timestamp',
          '<=',
          Timestamp.fromDate(end),
        )
      }

      const playwrightSnapshot = await playwrightQuery
        .limit(limit + offset)
        .get()
      const playwrightDocs = playwrightSnapshot.docs
        .slice(offset)
        .map((doc) => {
          const data = doc.data() as PlaywrightResultDoc
          return {
            id: doc.id,
            runner: data.runner ?? 'playwright',
            projectId: data.projectId,
            projectName: data.projectName,
            success: data.success,
            totalTests: data.totalTests,
            passed: data.passed,
            failed: data.failed,
            skipped: data.skipped,
            duration: data.duration,
            specFiles: data.specFiles,
            output: data.output,
            error: data.error,
            resourceUsage: data.resourceUsage,
            timestamp: data.timestamp.toDate(),
          } as PlaywrightResult
        })
      results.push(...playwrightDocs)
    }

    results.sort((a, b) => {
      const aTime = 'timestamp' in a ? a.timestamp.getTime() : 0
      const bTime = 'timestamp' in b ? b.timestamp.getTime() : 0
      return bTime - aTime
    })

    const paginatedResults = results.slice(0, limit)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items: paginatedResults,
        total: results.length,
        page,
        pageSize: limit,
        hasMore: results.length > limit,
      },
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
