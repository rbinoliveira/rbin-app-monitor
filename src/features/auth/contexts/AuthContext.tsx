'use client'

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'

import {
  appPublicRoutes,
  appRoutes,
} from '@/shared/constants/app-routes.constant'
import { addAuthCookies } from '@/shared/helpers/add-auth-cookies.helper'
import { deleteAuthCookies } from '@/shared/helpers/delete-auth-cookies.helper'
import { getFirebaseAuthOptional } from '@/shared/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function firebaseUserToCookieUser(user: User) {
  return {
    id: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? null,
    photo: user.photoURL ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const firebaseAuth = getFirebaseAuthOptional()

    if (!firebaseAuth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (authUser) => {
      try {
        if (authUser) {
          await addAuthCookies({ user: firebaseUserToCookieUser(authUser) })
          setUser(authUser)

          if (
            typeof window !== 'undefined' &&
            appPublicRoutes.includes(window.location.pathname)
          ) {
            window.location.replace(appRoutes.dashboard)
          }
        } else {
          await deleteAuthCookies()
          setUser(null)

          if (
            typeof window !== 'undefined' &&
            !appPublicRoutes.includes(window.location.pathname)
          ) {
            window.location.replace(appRoutes.signIn)
          }
        }
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuthOptional()

    if (!auth) {
      throw new Error('Firebase is not initialized')
    }

    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOut = async () => {
    const auth = getFirebaseAuthOptional()

    if (auth) {
      await firebaseSignOut(auth)
    }

    await deleteAuthCookies()
    setUser(null)

    if (typeof window !== 'undefined') {
      window.location.replace(appRoutes.signIn)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
