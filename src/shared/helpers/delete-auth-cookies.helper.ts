import { deleteCookie } from 'cookies-next'

import { appCookies } from '@/shared/constants/app-cookies.constant'

export async function deleteAuthCookies(): Promise<void> {
  await deleteCookie(appCookies.USER)
}
