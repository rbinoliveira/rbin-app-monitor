export type UserCookie = {
  id: string
  email: string
  name?: string | null
  photo?: string | null
}

export function parseUserCookie(value: unknown): UserCookie | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id.trim()) return null
  if (typeof o.email !== 'string' || !o.email.trim()) return null
  return {
    id: o.id.trim(),
    email: o.email.trim(),
    name: typeof o.name === 'string' ? o.name : null,
    photo: typeof o.photo === 'string' ? o.photo : null,
  }
}
