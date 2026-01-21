import { type NextRequest, NextResponse } from 'next/server'

export interface AuthOptions {
  requireSecret?: boolean
  secretKey?: string
}

export interface RateLimitOptions {
  maxRequests?: number
  windowMs?: number
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function verifyApiAuth(
  request: NextRequest,
  options: AuthOptions = {},
): { authorized: boolean; error?: string } {
  const { requireSecret = false, secretKey = 'API_SECRET_KEY' } = options

  if (!requireSecret) {
    return { authorized: true }
  }

  const secret = process.env[secretKey]

  if (!secret) {
    return {
      authorized: false,
      error: 'API authentication not configured',
    }
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return {
      authorized: false,
      error: 'Authorization header is required',
    }
  }

  const expectedAuth = `Bearer ${secret}`
  const isAuthorized = authHeader === expectedAuth

  if (!isAuthorized) {
    return {
      authorized: false,
      error: 'Invalid authorization token',
    }
  }

  return { authorized: true }
}

export function requireApiAuth(
  request: NextRequest,
  options: AuthOptions = {},
): NextResponse | null {
  const { authorized, error } = verifyApiAuth(request, options)

  if (!authorized) {
    return NextResponse.json(
      {
        success: false,
        error: error || 'Unauthorized',
      },
      { status: 401 },
    )
  }

  return null
}

export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
): { allowed: boolean; remaining: number; resetAt?: number } {
  const { maxRequests = 100, windowMs = 60000 } = options

  const clientId =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const now = Date.now()
  const entry = rateLimitStore.get(clientId)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    rateLimitStore.set(clientId, { count: 1, resetAt })
    cleanupExpiredEntries(now)
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

export function requireRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
): NextResponse | null {
  const { allowed } = checkRateLimit(request, options)

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': options.maxRequests?.toString() || '100',
          'X-RateLimit-Remaining': '0',
          ...(resetAt && {
            'X-RateLimit-Reset': new Date(resetAt).toISOString(),
          }),
        },
      },
    )
  }

  return null
}
