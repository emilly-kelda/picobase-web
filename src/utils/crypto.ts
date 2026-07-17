// Application-layer encryption for high-sensitivity fields (health data, future
// financial credentials). Server-only — uses Node's `crypto`, never import this
// from a 'use client' component.

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // bytes — recommended nonce size for GCM
const KEY_HEX_LENGTH = 64 // 32-byte key, hex-encoded

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== KEY_HEX_LENGTH) {
    throw new Error('ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

// Stored format: <iv>:<authTag>:<ciphertext>, each hex-encoded.
const ENCRYPTED_FORMAT = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

// Values written before this helper existed are still plaintext in the database.
// Anything not matching our iv:authTag:ciphertext format is returned unchanged
// rather than thrown on, so old rows keep rendering instead of 500ing.
export function decrypt(data: string): string {
  if (!ENCRYPTED_FORMAT.test(data)) return data

  const key = getKey()
  const [ivHex, authTagHex, ciphertextHex] = data.split(':')
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}
