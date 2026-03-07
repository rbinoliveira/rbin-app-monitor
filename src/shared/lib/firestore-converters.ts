import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  Timestamp,
  type WithFieldValue,
} from 'firebase/firestore'

import type {
  CypressResult,
  CypressResultDoc,
  FirestoreTimestamp,
  HealthCheckResult,
  HealthCheckResultDoc,
  PlaywrightResult,
  PlaywrightResultDoc,
  Project,
  ProjectDoc,
} from '@/shared/types'

// Helper to convert Firestore Timestamp to Date
function timestampToDate(timestamp: FirestoreTimestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

// ============================================
// Project Converter
// ============================================

type LegacyProjectDoc = ProjectDoc & {
  baseUrl?: string
  projectType?: 'front' | 'back'
  runCypressTests?: boolean
  monitoringTypes?: string[]
}

export const projectConverter: FirestoreDataConverter<Project, ProjectDoc> = {
  toFirestore(project: WithFieldValue<Project>): WithFieldValue<ProjectDoc> {
    const p = project as Project
    return {
      name: p.name,
      frontHealthCheckUrl: p.frontHealthCheckUrl,
      backHealthCheckUrl: p.backHealthCheckUrl,
      cypressRunUrl: p.cypressRunUrl,
      playwrightRunUrl: p.playwrightRunUrl,
      status: p.status,
      isActive: p.isActive,
      lastCheckAt: p.lastCheckAt ? Timestamp.fromDate(p.lastCheckAt) : null,
      createdAt: Timestamp.fromDate(p.createdAt),
      updatedAt: Timestamp.fromDate(p.updatedAt),
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<ProjectDoc>,
    options?: SnapshotOptions,
  ): Project {
    const data = snapshot.data(options) as LegacyProjectDoc
    const hasNew =
      data.frontHealthCheckUrl != null ||
      data.backHealthCheckUrl != null ||
      data.cypressRunUrl != null
    let frontHealthCheckUrl = data.frontHealthCheckUrl ?? null
    let backHealthCheckUrl = data.backHealthCheckUrl ?? null
    let cypressRunUrl = data.cypressRunUrl ?? null
    const playwrightRunUrl = data.playwrightRunUrl ?? null
    if (!hasNew && data.baseUrl) {
      const baseUrl = data.baseUrl.trim()
      const isBack =
        data.projectType === 'back' || data.monitoringTypes?.includes('rest')
      const isFront =
        data.projectType === 'front' ||
        data.monitoringTypes?.includes('web') ||
        data.monitoringTypes?.includes('wordpress')
      if (isFront) frontHealthCheckUrl = baseUrl
      if (isBack) backHealthCheckUrl = baseUrl
      if (
        data.runCypressTests ||
        data.monitoringTypes?.includes('cypress')
      ) {
        cypressRunUrl = baseUrl
      }
    }
    return {
      id: snapshot.id,
      name: data.name,
      frontHealthCheckUrl,
      backHealthCheckUrl,
      cypressRunUrl,
      playwrightRunUrl,
      status: data.status,
      isActive: data.isActive ?? true,
      lastCheckAt: timestampToDate(data.lastCheckAt),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  },
}

// ============================================
// Health Check Result Converter
// ============================================

export const healthCheckResultConverter: FirestoreDataConverter<
  HealthCheckResult,
  HealthCheckResultDoc
> = {
  toFirestore(
    result: WithFieldValue<HealthCheckResult>,
  ): WithFieldValue<HealthCheckResultDoc> {
    const r = result as HealthCheckResult
    return {
      projectId: r.projectId,
      projectName: r.projectName,
      type: r.type,
      url: r.url,
      success: r.success,
      statusCode: r.statusCode,
      responseTime: r.responseTime,
      errorMessage: r.errorMessage,
      timestamp: Timestamp.fromDate(r.timestamp),
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<HealthCheckResultDoc>,
    options?: SnapshotOptions,
  ): HealthCheckResult {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      projectId: data.projectId,
      projectName: data.projectName,
      type: data.type,
      url: data.url,
      success: data.success,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      errorMessage: data.errorMessage,
      timestamp: data.timestamp.toDate(),
    }
  },
}

// ============================================
// Cypress Result Converter (monitored projects running Cypress)
// ============================================

export const cypressResultConverter: FirestoreDataConverter<
  CypressResult,
  CypressResultDoc
> = {
  toFirestore(
    result: WithFieldValue<CypressResult>,
  ): WithFieldValue<CypressResultDoc> {
    const r = result as CypressResult
    return {
      projectId: r.projectId,
      projectName: r.projectName,
      success: r.success,
      totalTests: r.totalTests,
      passed: r.passed,
      failed: r.failed,
      skipped: r.skipped,
      duration: r.duration,
      specFiles: r.specFiles,
      output: r.output,
      timestamp: Timestamp.fromDate(r.timestamp),
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<CypressResultDoc>,
    options?: SnapshotOptions,
  ): CypressResult {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
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
    }
  },
}

// ============================================
// Playwright Result Converter (monitored projects running Playwright)
// ============================================

export const playwrightResultConverter: FirestoreDataConverter<
  PlaywrightResult,
  PlaywrightResultDoc
> = {
  toFirestore(
    result: WithFieldValue<PlaywrightResult>,
  ): WithFieldValue<PlaywrightResultDoc> {
    const r = result as PlaywrightResult
    return {
      projectId: r.projectId,
      projectName: r.projectName,
      success: r.success,
      totalTests: r.totalTests,
      passed: r.passed,
      failed: r.failed,
      skipped: r.skipped,
      duration: r.duration,
      specFiles: r.specFiles,
      output: r.output,
      timestamp: Timestamp.fromDate(r.timestamp),
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<PlaywrightResultDoc>,
    options?: SnapshotOptions,
  ): PlaywrightResult {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
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
    }
  },
}
