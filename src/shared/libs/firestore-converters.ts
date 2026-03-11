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
} from '@/shared/types/cypress-result.type'
import type { Project, ProjectDoc } from '@/shared/types/project.type'

// ============================================
// Project Converter
// ============================================

export const projectConverter: FirestoreDataConverter<Project, ProjectDoc> = {
  toFirestore(project: WithFieldValue<Project>): WithFieldValue<ProjectDoc> {
    const p = project as Project
    return {
      name: p.name,
      cypressGithubRepo: p.cypressGithubRepo,
      isActive: p.isActive,
      createdAt: Timestamp.fromDate(p.createdAt),
      updatedAt: Timestamp.fromDate(p.updatedAt),
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<ProjectDoc>,
    options?: SnapshotOptions,
  ): Project {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      name: data.name,
      cypressGithubRepo: data.cypressGithubRepo ?? null,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
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
      runner: 'cypress',
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
    }
  },
}
