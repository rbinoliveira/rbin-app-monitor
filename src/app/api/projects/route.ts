import { NextRequest, NextResponse } from 'next/server'

import { createProject, getAllProjects } from '@/services'
import type { ApiResponse, CreateProjectInput } from '@/types'

export async function GET(_request: NextRequest) {
  try {
    const projects = await getAllProjects()

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: projects,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectInput = await request.json()

    const project = await createProject(body)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: project,
      },
      { status: 201 },
    )
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('not found') ? 404 : 400

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: statusCode },
    )
  }
}
