import { setCookie } from 'cookies-next'

import { appCookies } from '@/shared/constants/app-cookies.constants'

export type AuthCookieUser = {
  id: string
  email: string
  name?: string | null
  photo?: string | null
}

export async function addAuthCookies({
  user,
}: {
  user: AuthCookieUser
}): Promise<void> {
  await setCookie(appCookies.USER, JSON.stringify(user), {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
