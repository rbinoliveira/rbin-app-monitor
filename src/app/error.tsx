'use client'

import { useEffect } from 'react'

import { Button } from '@/shared/components/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-600">{error.message}</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
