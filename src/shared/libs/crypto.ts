import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32
const ENV_VAR = 'CREDENTIALS_ENCRYPTION_KEY'

function getKey(): Buffer {
  const raw = process.env[ENV_VAR]

  if (!raw) {
    throw new Error(
      `${ENV_VAR} is not configured. Generate with: openssl rand -base64 32`,
    )
  }

  const key = Buffer.from(raw, 'base64')

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `${ENV_VAR} must decode to ${KEY_LENGTH} bytes (got ${key.length}). Generate with: openssl rand -base64 32`,
    )
  }

  return key
}

export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':')
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format')
  }

  const [ivB64, tagB64, ciphertextB64] = parts
  const key = getKey()
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return plaintext.toString('utf8')
}
