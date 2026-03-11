import { Timestamp } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/libs/api-auth'
import { COLLECTION_NAMES } from '@/shared/libs/constants'
import { getAdminDb } from '@/shared/libs/firebase-admin'
import type { ApiResponse } from '@/shared/types/api-response.type'
import type {
  CypressResult,
  CypressResultDoc,
} from '@/shared/types/cypress-result.type'

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

    const results: CypressResult[] = []
    const limit = pageSize
    const offset = (page - 1) * pageSize

    if (type === 'cypress' || !type) {
      let cypressQuery = getAdminDb()
        .collection(COLLECTION_NAMES.CYPRESS_RESULTS)
        .orderBy('timestamp', 'desc')

      if (projectId) {
        cypressQuery = cypressQuery.where('projectId', '==', projectId)
      }

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
          trigger: data.trigger,
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

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

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
