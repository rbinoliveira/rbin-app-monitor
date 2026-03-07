import { getCookie } from 'cookies-next'

import { appCookies } from '@/shared/constants/app-cookies.constants'

export async function getAuthCookies(): Promise<string | undefined> {
  const value = await getCookie(appCookies.USER)
  return typeof value === 'string' ? value : undefined
}
