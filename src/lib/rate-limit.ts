import 'server-only'
import { createHash } from 'node:crypto'
import { env } from '@/env'
import { db } from '@/lib/db'

/**
 * Rate limiting de ventana fija guardado en Postgres (tabla "RateLimit").
 *
 * Un único INSERT … ON CONFLICT hace el incremento de forma atómica, así que funciona bien con
 * varias instancias de funciones en paralelo. Los identificadores (IP, email) se guardan como
 * hash con sal (AUTH_SECRET): nunca en claro.
 */

export type RateLimitRule = {
  /** Ámbito, p. ej. "contacto" o "login". */
  scope: string
  /** Máximo de intentos por ventana. */
  limit: number
  /** Duración de la ventana en segundos. */
  windowSeconds: number
}

export const RATE_LIMITS = {
  formularioPublico: { scope: 'form', limit: 5, windowSeconds: 10 * 60 },
  login: { scope: 'login', limit: 10, windowSeconds: 15 * 60 },
  recuperarClave: { scope: 'forgot', limit: 5, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: Date }

function hashIdentifier(identifier: string) {
  return createHash('sha256').update(`${env.AUTH_SECRET}:${identifier}`).digest('hex').slice(0, 32)
}

export async function rateLimit(rule: RateLimitRule, identifier: string): Promise<RateLimitResult> {
  const key = `${rule.scope}:${hashIdentifier(identifier)}`

  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${rule.windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now()
                       THEN now() + make_interval(secs => ${rule.windowSeconds})
                       ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"
  `
  const row = rows[0]
  if (!row) throw new Error('rateLimit: sin resultado')

  // Limpieza oportunista de ventanas vencidas (1 de cada 50 llamadas).
  if (Math.random() < 0.02) {
    void db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {})
  }

  return {
    ok: row.count <= rule.limit,
    remaining: Math.max(0, rule.limit - row.count),
    resetAt: row.resetAt,
  }
}
