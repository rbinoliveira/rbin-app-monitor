import { Timestamp } from 'firebase-admin/firestore'

import { ApiError } from '@/shared/lib/api-response'
import {
  COLLECTION_NAMES,
  HTTP_STATUS,
  VALID_MONITORING_TYPES,
} from '@/shared/lib/constants'
import { getAdminDb } from '@/shared/lib/firebase-admin'
import {
  isValidUrl,
  notEmpty,
  notEmptyArray,
  oneOf,
} from '@/shared/lib/validation'
import type {
  CreateProjectInput,
  MonitoringType,
  Project,
  ProjectDoc,
  ProjectStatus,
  UpdateProjectInput,
} from '@/shared/types'

const PROJECTS_COLLECTION = COLLECTION_NAMES.PROJECTS

function projectToFirestore(project: Project): ProjectDoc {
  return {
    name: project.name,
    baseUrl: project.baseUrl,
    monitoringTypes: project.monitoringTypes,
    status: project.status,
    isActive: project.isActive,
    lastCheckAt: project.lastCheckAt
      ? Timestamp.fromDate(project.lastCheckAt)
      : null,
    createdAt: Timestamp.fromDate(project.createdAt),
    updatedAt: Timestamp.fromDate(project.updatedAt),
  }
}

function projectFromFirestore(docId: string, data: ProjectDoc): Project {
  return {
    id: docId,
    name: data.name,
    baseUrl: data.baseUrl,
    monitoringTypes: data.monitoringTypes,
    status: data.status,
    isActive: data.isActive ?? true,
    lastCheckAt: data.lastCheckAt ? data.lastCheckAt.toDate() : null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
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

function validateMonitoringTypes(types: MonitoringType[]): MonitoringType[] {
  notEmptyArray(types, 'monitoringTypes')

  const validTypes = VALID_MONITORING_TYPES as readonly string[]
  const invalidTypes = types.filter((type) => !validTypes.includes(type))
  if (invalidTypes.length > 0) {
    throw new ApiError(
      `Invalid monitoring types: ${invalidTypes.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  return types
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const name = validateProjectName(input.name)
  const baseUrl = isValidUrl(input.baseUrl, 'baseUrl').trim()
  const monitoringTypes = validateMonitoringTypes(input.monitoringTypes)

  const now = new Date()
  const projectData: Project = {
    id: '',
    name,
    baseUrl,
    monitoringTypes,
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

  if (input.baseUrl !== undefined) {
    updates.baseUrl = isValidUrl(input.baseUrl, 'baseUrl').trim()
  }

  if (input.monitoringTypes !== undefined) {
    updates.monitoringTypes = validateMonitoringTypes(input.monitoringTypes)
  }

  if (input.isActive !== undefined) {
    updates.isActive = input.isActive
  }

  const updatedProject = { ...project, ...updates }

  const updateData: Partial<ProjectDoc> = {
    updatedAt: Timestamp.fromDate(updatedProject.updatedAt),
  }

  if (updates.name !== undefined) updateData.name = updatedProject.name
  if (updates.baseUrl !== undefined) updateData.baseUrl = updatedProject.baseUrl
  if (updates.monitoringTypes !== undefined)
    updateData.monitoringTypes = updatedProject.monitoringTypes
  if (updates.isActive !== undefined)
    updateData.isActive = updatedProject.isActive

  await getAdminDb()
    .collection(PROJECTS_COLLECTION)
    .doc(projectId)
    .update(updateData)

  return updatedProject
}

export async function deleteProject(projectId: string): Promise<void> {
  // Verify project exists (will throw if not found)
  await getProjectById(projectId)

  await getAdminDb().collection(PROJECTS_COLLECTION).doc(projectId).delete()
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  lastCheckAt?: Date,
): Promise<void> {
  // Verify project exists (will throw if not found)
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
