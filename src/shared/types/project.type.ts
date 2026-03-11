import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export interface Project {
  id: string
  name: string
  cypressGithubRepo: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProjectDoc {
  name: string
  cypressGithubRepo: string | null
  isActive: boolean
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface CreateProjectInput {
  name: string
  cypressGithubRepo?: string | null
}

export interface UpdateProjectInput {
  name?: string
  cypressGithubRepo?: string | null
  isActive?: boolean
}
