import { Timestamp } from 'firebase-admin/firestore'

import { ApiError } from '@/shared/libs/api-response'
import { COLLECTION_NAMES, HTTP_STATUS } from '@/shared/libs/constants'
import { getAdminDb } from '@/shared/libs/firebase-admin'
import type {
  CreateProjectInput,
  Project,
  ProjectDoc,
  UpdateProjectInput,
} from '@/shared/types/project.type'
import { notEmpty } from '@/shared/validations/required-string.validation'

const PROJECTS_COLLECTION = COLLECTION_NAMES.PROJECTS

function projectToFirestore(project: Project): ProjectDoc {
  return {
    userId: project.userId,
    name: project.name,
    cypressGithubRepo: project.cypressGithubRepo,
    isActive: project.isActive,
    createdAt: Timestamp.fromDate(project.createdAt),
    updatedAt: Timestamp.fromDate(project.updatedAt),
  }
}

function projectFromFirestore(docId: string, data: ProjectDoc): Project {
  return {
    id: docId,
    userId: data.userId,
    name: data.name,
    cypressGithubRepo: data.cypressGithubRepo ?? null,
    isActive: data.isActive ?? true,
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

export async function createProject(
  input: CreateProjectInput,
  userId: string,
): Promise<Project> {
  const name = validateProjectName(input.name)
  const cypressGithubRepo = (input.cypressGithubRepo ?? '').trim() || null

  const now = new Date()
  const projectData: Project = {
    id: '',
    userId,
    name,
    cypressGithubRepo,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = getAdminDb().collection(PROJECTS_COLLECTION).doc()
  await docRef.set(projectToFirestore({ ...projectData, id: docRef.id }))

  return { ...projectData, id: docRef.id }
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

export async function getProjectByIdForUser(
  projectId: string,
  userId: string,
): Promise<Project> {
  const project = await getProjectById(projectId)

  if (project.userId !== userId) {
    throw new ApiError('Project not found', HTTP_STATUS.NOT_FOUND)
  }

  return project
}

export async function getAllProjects(userId: string): Promise<Project[]> {
  const snapshot = await getAdminDb()
    .collection(PROJECTS_COLLECTION)
    .where('userId', '==', userId)
    .get()

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
  userId: string,
): Promise<Project> {
  const project = await getProjectByIdForUser(projectId, userId)

  const updates: Partial<Project> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) {
    updates.name = validateProjectName(input.name)
  }

  if (input.cypressGithubRepo !== undefined) {
    updates.cypressGithubRepo = (input.cypressGithubRepo ?? '').trim() || null
  }

  if (input.isActive !== undefined) {
    updates.isActive = input.isActive
  }

  const updatedProject = { ...project, ...updates }

  const updateData: Partial<ProjectDoc> = {
    updatedAt: Timestamp.fromDate(updatedProject.updatedAt),
  }

  if (updates.name !== undefined) updateData.name = updatedProject.name
  if (updates.cypressGithubRepo !== undefined)
    updateData.cypressGithubRepo = updatedProject.cypressGithubRepo
  if (updates.isActive !== undefined)
    updateData.isActive = updatedProject.isActive

  await getAdminDb()
    .collection(PROJECTS_COLLECTION)
    .doc(projectId)
    .update(updateData)

  return updatedProject
}

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<void> {
  await getProjectByIdForUser(projectId, userId)
  await getAdminDb().collection(PROJECTS_COLLECTION).doc(projectId).delete()
}
