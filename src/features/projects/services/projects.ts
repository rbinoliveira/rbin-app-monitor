import { Timestamp } from 'firebase-admin/firestore'

import { ApiError } from '@/shared/lib/api-response'
import { COLLECTION_NAMES, HTTP_STATUS } from '@/shared/lib/constants'
import { getAdminDb } from '@/shared/lib/firebase-admin'
import { notEmpty, oneOf, optionalUrl } from '@/shared/lib/validation'
import type {
  CreateProjectInput,
  Project,
  ProjectDoc,
  ProjectStatus,
  UpdateProjectInput,
} from '@/shared/types'

const PROJECTS_COLLECTION = COLLECTION_NAMES.PROJECTS

function projectToFirestore(project: Project): ProjectDoc {
  return {
    name: project.name,
    frontHealthCheckUrl: project.frontHealthCheckUrl,
    backHealthCheckUrl: project.backHealthCheckUrl,
    cypressRunUrl: project.cypressRunUrl,
    status: project.status,
    isActive: project.isActive,
    lastCheckAt: project.lastCheckAt
      ? Timestamp.fromDate(project.lastCheckAt)
      : null,
    createdAt: Timestamp.fromDate(project.createdAt),
    updatedAt: Timestamp.fromDate(project.updatedAt),
  }
}

type LegacyProjectDoc = ProjectDoc & {
  baseUrl?: string
  projectType?: 'front' | 'back'
  runCypressTests?: boolean
  monitoringTypes?: string[]
}

function projectFromFirestore(docId: string, data: ProjectDoc): Project {
  const doc = data as LegacyProjectDoc

  const hasNewFields =
    doc.frontHealthCheckUrl != null ||
    doc.backHealthCheckUrl != null ||
    doc.cypressRunUrl != null

  let frontHealthCheckUrl: string | null = doc.frontHealthCheckUrl ?? null
  let backHealthCheckUrl: string | null = doc.backHealthCheckUrl ?? null
  let cypressRunUrl: string | null = doc.cypressRunUrl ?? null

  if (!hasNewFields && doc.baseUrl) {
    const baseUrl = doc.baseUrl.trim()
    const isBack =
      doc.projectType === 'back' || doc.monitoringTypes?.includes('rest')
    const isFront =
      doc.projectType === 'front' || doc.monitoringTypes?.includes('web') || doc.monitoringTypes?.includes('wordpress')
    if (isFront) frontHealthCheckUrl = baseUrl
    if (isBack) backHealthCheckUrl = baseUrl
    if (doc.runCypressTests || doc.monitoringTypes?.includes('cypress')) {
      cypressRunUrl = baseUrl
    }
  }

  return {
    id: docId,
    name: doc.name,
    frontHealthCheckUrl,
    backHealthCheckUrl,
    cypressRunUrl,
    status: doc.status,
    isActive: doc.isActive ?? true,
    lastCheckAt: doc.lastCheckAt ? doc.lastCheckAt.toDate() : null,
    createdAt: doc.createdAt.toDate(),
    updatedAt: doc.updatedAt.toDate(),
  }
}

function validateProjectName(name: string): string {
  const trimmed = notEmpty(name, 'name')
  if (trimmed.length < 3) {
    throw new ApiError(
      'Project name must be at least 3 characters long',
      HTTP_STATUS.BAD_REQUEST,
    )
  }
  return trimmed
}

function validateAtLeastOneUrl(input: CreateProjectInput): void {
  const front = (input.frontHealthCheckUrl ?? '').trim()
  const back = (input.backHealthCheckUrl ?? '').trim()
  const cypress = (input.cypressRunUrl ?? '').trim()
  if (!front && !back && !cypress) {
    throw new ApiError(
      'Provide at least one URL: front health check, back health check, or Cypress run API',
      HTTP_STATUS.BAD_REQUEST,
    )
  }
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const name = validateProjectName(input.name)
  validateAtLeastOneUrl(input)

  const frontHealthCheckUrl = optionalUrl(
    input.frontHealthCheckUrl,
    'frontHealthCheckUrl',
  )
  const backHealthCheckUrl = optionalUrl(
    input.backHealthCheckUrl,
    'backHealthCheckUrl',
  )
  const cypressRunUrl = optionalUrl(input.cypressRunUrl, 'cypressRunUrl')

  const now = new Date()
  const projectData: Project = {
    id: '',
    name,
    frontHealthCheckUrl,
    backHealthCheckUrl,
    cypressRunUrl,
    status: 'unknown' as ProjectStatus,
    isActive: true,
    lastCheckAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = getAdminDb().collection(PROJECTS_COLLECTION).doc()
  await docRef.set(projectToFirestore({ ...projectData, id: docRef.id }))

  return {
    ...projectData,
    id: docRef.id,
  }
}

export async function getProjectById(projectId: string): Promise<Project> {
  const trimmedId = notEmpty(projectId, 'projectId')
  const docRef = getAdminDb().collection(PROJECTS_COLLECTION).doc(trimmedId)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw new ApiError('Project not found', HTTP_STATUS.NOT_FOUND)
  }

  const data = docSnap.data() as ProjectDoc
  return projectFromFirestore(docSnap.id, data)
}

export async function getAllProjects(): Promise<Project[]> {
  const snapshot = await getAdminDb().collection(PROJECTS_COLLECTION).get()

  return snapshot.docs.map((doc) => {
    const data = doc.data() as ProjectDoc
    return projectFromFirestore(doc.id, data)
  })
}

export async function getActiveProjects(): Promise<Project[]> {
  const snapshot = await getAdminDb()
    .collection(PROJECTS_COLLECTION)
    .where('isActive', '==', true)
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data() as ProjectDoc
    return projectFromFirestore(doc.id, data)
  })
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const project = await getProjectById(projectId)

  const updates: Partial<Project> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) {
    updates.name = validateProjectName(input.name)
  }

  if (input.frontHealthCheckUrl !== undefined) {
    updates.frontHealthCheckUrl = optionalUrl(
      input.frontHealthCheckUrl,
      'frontHealthCheckUrl',
    )
  }

  if (input.backHealthCheckUrl !== undefined) {
    updates.backHealthCheckUrl = optionalUrl(
      input.backHealthCheckUrl,
      'backHealthCheckUrl',
    )
  }

  if (input.cypressRunUrl !== undefined) {
    updates.cypressRunUrl = optionalUrl(input.cypressRunUrl, 'cypressRunUrl')
  }

  if (input.isActive !== undefined) {
    updates.isActive = input.isActive
  }

  const updatedProject = { ...project, ...updates }

  const atLeastOne =
    updatedProject.frontHealthCheckUrl ||
    updatedProject.backHealthCheckUrl ||
    updatedProject.cypressRunUrl
  if (!atLeastOne) {
    throw new ApiError(
      'Project must have at least one URL (front, back, or Cypress)',
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  const updateData: Partial<ProjectDoc> = {
    updatedAt: Timestamp.fromDate(updatedProject.updatedAt),
  }

  if (updates.name !== undefined) updateData.name = updatedProject.name
  if (updates.frontHealthCheckUrl !== undefined)
    updateData.frontHealthCheckUrl = updatedProject.frontHealthCheckUrl
  if (updates.backHealthCheckUrl !== undefined)
    updateData.backHealthCheckUrl = updatedProject.backHealthCheckUrl
  if (updates.cypressRunUrl !== undefined)
    updateData.cypressRunUrl = updatedProject.cypressRunUrl
  if (updates.isActive !== undefined)
    updateData.isActive = updatedProject.isActive

  await getAdminDb()
    .collection(PROJECTS_COLLECTION)
    .doc(projectId)
    .update(updateData)

  return updatedProject
}

export async function deleteProject(projectId: string): Promise<void> {
  await getProjectById(projectId)
  await getAdminDb().collection(PROJECTS_COLLECTION).doc(projectId).delete()
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  lastCheckAt?: Date,
): Promise<void> {
  await getProjectById(projectId)

  const validStatuses: ProjectStatus[] = ['healthy', 'unhealthy', 'unknown']
  oneOf(status, validStatuses, 'status')

  const updateData: Partial<ProjectDoc> = {
    status,
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (lastCheckAt !== undefined) {
    updateData.lastCheckAt = Timestamp.fromDate(lastCheckAt)
  }

  await getAdminDb()
    .collection(PROJECTS_COLLECTION)
    .doc(projectId)
    .update(updateData)
}
