import { type App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { type Firestore, getFirestore } from 'firebase-admin/firestore'

let adminApp: App | null = null
let adminDb: Firestore | null = null

function getFirebaseAdmin(): App {
  if (adminApp) {
    return adminApp
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  // Check for service account (base64-encoded JSON)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
    const serviceAccount = JSON.parse(decoded)
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    })
    return adminApp
  }

  // Fallback: use individual environment variables
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
    return adminApp
  }

  throw new Error(
    'Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or individual FIREBASE_* environment variables.',
  )
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getFirebaseAdmin())
  }
  return adminDb
}

export function getAdminApp(): App {
  return getFirebaseAdmin()
}

export default getFirebaseAdmin
