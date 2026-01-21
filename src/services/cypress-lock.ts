import { Timestamp } from 'firebase-admin/firestore'

import { adminDb } from '@/lib/firebase-admin'

const LOCKS_COLLECTION = 'cypressLocks'
const DEFAULT_LOCK_TIMEOUT_MS = 30 * 60 * 1000

interface LockDocument {
  lockId: string
  createdAt: Timestamp
  expiresAt: Timestamp
}

export async function acquireLock(lockId: string): Promise<boolean> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + DEFAULT_LOCK_TIMEOUT_MS)

  try {
    const lockRef = adminDb.collection(LOCKS_COLLECTION).doc(lockId)
    const lockDoc = await lockRef.get()

    if (lockDoc.exists) {
      const lockData = lockDoc.data() as LockDocument
      const lockExpiresAt = lockData.expiresAt.toDate()

      if (now < lockExpiresAt) {
        return false
      }

      await lockRef.delete()
    }

    await lockRef.set({
      lockId,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    })

    return true
  } catch (error) {
    console.error(`Error acquiring lock ${lockId}:`, error)
    return false
  }
}

export async function releaseLock(lockId: string): Promise<void> {
  try {
    const lockRef = adminDb.collection(LOCKS_COLLECTION).doc(lockId)
    await lockRef.delete()
  } catch (error) {
    console.error(`Error releasing lock ${lockId}:`, error)
  }
}

export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const now = Timestamp.fromDate(new Date())
    const locksRef = adminDb.collection(LOCKS_COLLECTION)
    const snapshot = await locksRef.where('expiresAt', '<', now).get()

    const batch = adminDb.batch()
    let count = 0

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
      count++
    })

    if (count > 0) {
      await batch.commit()
    }

    return count
  } catch (error) {
    console.error('Error cleaning up expired locks:', error)
    return 0
  }
}
