import { type NextRequest, NextResponse } from 'next/server'

import { parseUserCookie } from '@/features/auth/schemas/user-cookie.schema'
import { appCookies } from '@/shared/constants/app-cookies.constants'
import {
  appPublicRoutes,
  appRoutes,
} from '@/shared/constants/app-routes.constants'

const publicApiRoutes = ['/api/health', '/api/cron']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const isStaticResource =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    /\.(jpg|jpeg|png|gif|svg|css|js)$/.test(pathname)

  if (isStaticResource) {
    return NextResponse.next()
  }

  const isPublicRoute = appPublicRoutes.includes(pathname)
  const userCookie = request.cookies.get(appCookies.USER)?.value

  let userIsAuthenticated = false
  try {
    if (userCookie) {
      const user = parseUserCookie(JSON.parse(userCookie))
      userIsAuthenticated = !!user
    }
  } catch {
    userIsAuthenticated = false
  }

  if (!isPublicRoute && !userIsAuthenticated) {
    return NextResponse.redirect(new URL(appRoutes.signIn, request.url))
  }

  if (userIsAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL(appRoutes.dashboard, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
