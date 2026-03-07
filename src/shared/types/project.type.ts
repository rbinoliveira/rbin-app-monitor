import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export type ProjectStatus = 'healthy' | 'unhealthy' | 'unknown'

export interface Project {
  id: string
  name: string
  frontHealthCheckUrl: string | null
  backHealthCheckUrl: string | null
  playwrightRunUrl: string | null
  cypressRunUrl: string | null
  status: ProjectStatus
  isActive: boolean
  lastCheckAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectDoc {
  name: string
  frontHealthCheckUrl: string | null
  backHealthCheckUrl: string | null
  playwrightRunUrl: string | null
  cypressRunUrl: string | null
  status: ProjectStatus
  isActive: boolean
  lastCheckAt: FirestoreTimestamp | null
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface CreateProjectInput {
  name: string
  frontHealthCheckUrl?: string | null
  backHealthCheckUrl?: string | null
  playwrightRunUrl?: string | null
  cypressRunUrl?: string | null
}

export interface UpdateProjectInput {
  name?: string
  frontHealthCheckUrl?: string | null
  backHealthCheckUrl?: string | null
  playwrightRunUrl?: string | null
  cypressRunUrl?: string | null
  isActive?: boolean
}
