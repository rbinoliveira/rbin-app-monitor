import { Timestamp } from 'firebase-admin/firestore'

import { ApiError } from '@/shared/libs/api-response'
import { COLLECTION_NAMES, HTTP_STATUS } from '@/shared/libs/constants'
import { decryptSecret, encryptSecret } from '@/shared/libs/crypto'
import { getAdminDb } from '@/shared/libs/firebase-admin'
import type {
  UserGithubCredentialDoc,
  UserGithubCredentialStatus,
} from '@/shared/types/user-credentials.type'

const COLLECTION = COLLECTION_NAMES.USER_CREDENTIALS

interface GithubUserResponse {
  login: string
}

async function fetchGithubUsername(token: string): Promise<string> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new ApiError(
      'GitHub rejected the provided token. Check scopes (repo, actions:write) and validity.',
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  const data = (await response.json()) as GithubUserResponse
  if (!data.login) {
    throw new ApiError(
      'GitHub API returned no user login for this token',
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  return data.login
}

export async function getUserGithubCredentialStatus(
  userId: string,
): Promise<UserGithubCredentialStatus> {
  const snap = await getAdminDb().collection(COLLECTION).doc(userId).get()

  if (!snap.exists) {
    return { configured: false, githubUsername: null, updatedAt: null }
  }

  const data = snap.data() as UserGithubCredentialDoc
  return {
    configured: true,
    githubUsername: data.githubUsername,
    updatedAt: data.updatedAt.toDate(),
  }
}

export async function getUserGithubToken(
  userId: string,
): Promise<{ token: string; username: string } | null> {
  const snap = await getAdminDb().collection(COLLECTION).doc(userId).get()
  if (!snap.exists) return null

  const data = snap.data() as UserGithubCredentialDoc
  return {
    token: decryptSecret(data.encryptedToken),
    username: data.githubUsername,
  }
}

export async function setUserGithubCredential(
  userId: string,
  token: string,
): Promise<UserGithubCredentialStatus> {
  const trimmed = token.trim()
  if (!trimmed) {
    throw new ApiError('Token is required', HTTP_STATUS.BAD_REQUEST)
  }

  const username = await fetchGithubUsername(trimmed)
  const encryptedToken = encryptSecret(trimmed)
  const updatedAt = Timestamp.fromDate(new Date())

  const doc: UserGithubCredentialDoc = {
    userId,
    githubUsername: username,
    encryptedToken,
    updatedAt,
  }

  await getAdminDb().collection(COLLECTION).doc(userId).set(doc)

  return {
    configured: true,
    githubUsername: username,
    updatedAt: updatedAt.toDate(),
  }
}

export async function deleteUserGithubCredential(userId: string): Promise<void> {
  await getAdminDb().collection(COLLECTION).doc(userId).delete()
}
