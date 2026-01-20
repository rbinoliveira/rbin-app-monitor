import { type App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { type Firestore, getFirestore } from 'firebase-admin/firestore'

function getFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // Check for service account JSON (for production with Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    })
  }

  // Fallback: use individual environment variables
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  }

  throw new Error(
    'Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or individual FIREBASE_* environment variables.',
  )
}

const adminApp = getFirebaseAdmin()
export const adminDb: Firestore = getFirestore(adminApp)

export default adminApp
