import { type NextRequest, NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login']

// API routes that should be excluded from auth check
const publicApiRoutes = ['/api/health', '/api/cron']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Get session cookie (Firebase sets this)
  const session = request.cookies.get('__session')

  // If no session and trying to access protected route, redirect to login
  if (!session && !pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If has session and trying to access login, redirect to home
  if (session && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
