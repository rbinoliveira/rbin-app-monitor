import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import type {
  Project,
  ProjectDoc,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
  COLLECTIONS,
} from '@/types'

const PROJECTS_COLLECTION = COLLECTIONS.PROJECTS

function projectToFirestore(project: Project): ProjectDoc {
  return {
    name: project.name,
    baseUrl: project.baseUrl,
    monitoringTypes: project.monitoringTypes,
    status: project.status,
    isActive: project.isActive,
    lastCheckAt: project.lastCheckAt ? Timestamp.fromDate(project.lastCheckAt) : null,
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

export async function createProject(input: CreateProjectInput): Promise<Project> {
  if (!input.name || input.name.trim().length < 3) {
    throw new Error('Project name must be at least 3 characters long')
  }

  if (!input.baseUrl || input.baseUrl.trim().length === 0) {
    throw new Error('Base URL is required')
  }

  try {
    new URL(input.baseUrl.trim())
  } catch {
    throw new Error('Base URL must be a valid URL')
  }

  if (!input.monitoringTypes || input.monitoringTypes.length === 0) {
    throw new Error('At least one monitoring type must be selected')
  }

  const validMonitoringTypes = ['web', 'rest', 'wordpress', 'cypress']
  const invalidTypes = input.monitoringTypes.filter((type) => !validMonitoringTypes.includes(type))
  if (invalidTypes.length > 0) {
    throw new Error(`Invalid monitoring types: ${invalidTypes.join(', ')}`)
  }

  const now = new Date()
  const projectData: Project = {
    id: '',
    name: input.name.trim(),
    baseUrl: input.baseUrl.trim(),
    monitoringTypes: input.monitoringTypes,
    status: 'unknown' as ProjectStatus,
    isActive: true,
    lastCheckAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = adminDb.collection(PROJECTS_COLLECTION).doc()
  await docRef.set(projectToFirestore({ ...projectData, id: docRef.id }))

  return {
    ...projectData,
    id: docRef.id,
  }
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const docRef = adminDb.collection(PROJECTS_COLLECTION).doc(projectId)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    return null
  }

  const data = docSnap.data() as ProjectDoc
  return projectFromFirestore(docSnap.id, data)
}

export async function getAllProjects(): Promise<Project[]> {
  const snapshot = await adminDb.collection(PROJECTS_COLLECTION).get()

  return snapshot.docs.map((doc) => {
    const data = doc.data() as ProjectDoc
    return projectFromFirestore(doc.id, data)
  })
}

export async function getActiveProjects(): Promise<Project[]> {
  const snapshot = await adminDb
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
  input: UpdateProjectInput
): Promise<Project> {
  const project = await getProjectById(projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  const updates: Partial<Project> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) {
    if (input.name.trim().length < 3) {
      throw new Error('Project name must be at least 3 characters long')
    }
    updates.name = input.name.trim()
  }

  if (input.baseUrl !== undefined) {
    try {
      new URL(input.baseUrl.trim())
    } catch {
      throw new Error('Base URL must be a valid URL')
    }
    updates.baseUrl = input.baseUrl.trim()
  }

  if (input.monitoringTypes !== undefined) {
    if (input.monitoringTypes.length === 0) {
      throw new Error('At least one monitoring type must be selected')
    }
    const validMonitoringTypes = ['web', 'rest', 'wordpress', 'cypress']
    const invalidTypes = input.monitoringTypes.filter(
      (type) => !validMonitoringTypes.includes(type)
    )
    if (invalidTypes.length > 0) {
      throw new Error(`Invalid monitoring types: ${invalidTypes.join(', ')}`)
    }
    updates.monitoringTypes = input.monitoringTypes
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
  if (updates.isActive !== undefined) updateData.isActive = updatedProject.isActive

  await adminDb.collection(PROJECTS_COLLECTION).doc(projectId).update(updateData)

  return updatedProject
}

export async function deleteProject(projectId: string): Promise<void> {
  const project = await getProjectById(projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  await adminDb.collection(PROJECTS_COLLECTION).doc(projectId).delete()
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  lastCheckAt?: Date
): Promise<void> {
  const project = await getProjectById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const updateData: Partial<ProjectDoc> = {
    status,
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (lastCheckAt !== undefined) {
    updateData.lastCheckAt = Timestamp.fromDate(lastCheckAt)
  }

  await adminDb.collection(PROJECTS_COLLECTION).doc(projectId).update(updateData)
}

