import 'server-only'
import { env } from '@/env'

/**
 * Verifica un token de Cloudflare Turnstile. Si Turnstile no está configurado
 * (TURNSTILE_SECRET_KEY vacío), la verificación se omite: el sitio queda protegido por el
 * honeypot y el rate limiting.
 */
export async function verifyTurnstile(token: string | undefined, ip: string) {
  if (!env.TURNSTILE_SECRET_KEY) return true
  if (!token) return false

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
      signal: AbortSignal.timeout(5000),
    })
    const data = (await response.json()) as { success?: boolean }
    return data.success === true
  } catch {
    console.error('[turnstile] no se pudo verificar el token')
    return false
  }
}
