import { Timestamp } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'

import { adminDb } from '@/lib/firebase-admin'
import type {
  ApiResponse,
  CypressResult,
  CypressResultDoc,
  HealthCheckResult,
  HealthCheckResultDoc,
} from '@/types'
import { COLLECTIONS } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const results: (HealthCheckResult | CypressResult)[] = []
    const limit = pageSize
    const offset = (page - 1) * pageSize

    let healthCheckQuery = adminDb
      .collection(COLLECTIONS.HEALTH_CHECK_RESULTS)
      .orderBy('timestamp', 'desc')

    let cypressQuery = adminDb
      .collection(COLLECTIONS.CYPRESS_RESULTS)
      .orderBy('timestamp', 'desc')

    if (projectId) {
      healthCheckQuery = healthCheckQuery.where('projectId', '==', projectId)
      cypressQuery = cypressQuery.where('projectId', '==', projectId)
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
