import 'server-only'
import { env } from '@/env'

/**
 * Cliente del daemon de automatización SII (FastAPI en un PC de la oficina, expuesto por un túnel
 * de Cloudflare). El contrato HTTP es fijo: no cambiar rutas, cuerpos, header ni timeouts.
 *
 * Nunca se registra el cuerpo de las peticiones: contiene la clave SII.
 */

export const TIMEOUTS = { consulta: 10_000, individual: 15_000, masivo: 30_000 } as const

export type RespuestaDaemon =
  | { tipo: 'json'; status: number; data: unknown }
  /** El daemon (o el túnel) respondió algo que no es JSON: HTML de error, texto, etc. */
  | { tipo: 'no-json'; status: number; raw: string }
  /** No se pudo contactar (timeout, DNS, túnel caído). */
  | { tipo: 'error-red'; mensaje: string }
  /** Falta DAEMON_URL. */
  | { tipo: 'sin-configurar' }

export function daemonConfigurado() {
  return Boolean(env.DAEMON_URL)
}

/** Igual que el `safeJson` del sitio anterior: si no es JSON, guarda el texto crudo. */
async function leerRespuesta(res: Response): Promise<RespuestaDaemon> {
  const texto = await res.text()
  try {
    return { tipo: 'json', status: res.status, data: JSON.parse(texto) }
  } catch {
    return { tipo: 'no-json', status: res.status, raw: texto }
  }
}

export async function llamarDaemon(
  ruta: string,
  {
    method = 'GET',
    json,
    form,
    timeoutMs,
  }: { method?: 'GET' | 'POST'; json?: unknown; form?: FormData; timeoutMs: number },
): Promise<RespuestaDaemon> {
  if (!env.DAEMON_URL) return { tipo: 'sin-configurar' }
  const headers: Record<string, string> = { 'x-daemon-secret': env.DAEMON_SECRET ?? '' }
  if (json !== undefined) headers['Content-Type'] = 'application/json'

  try {
    const res = await fetch(`${env.DAEMON_URL.replace(/\/+$/, '')}${ruta}`, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : form,
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
    return await leerRespuesta(res)
  } catch (error) {
    const e = error as Error
    const mensaje =
      e.name === 'TimeoutError'
        ? 'El daemon no respondió a tiempo'
        : 'No se pudo contactar al daemon'
    return { tipo: 'error-red', mensaje }
  }
}

/** Estado del daemon para el panel y "Estado del sistema". /health no exige secreto. */
export async function saludDaemon(): Promise<'conectado' | 'no-disponible' | 'sin-configurar'> {
  const r = await llamarDaemon('/health', { timeoutMs: TIMEOUTS.consulta })
  if (r.tipo === 'sin-configurar') return 'sin-configurar'
  if (r.tipo === 'json' && r.status === 200 && (r.data as { ok?: unknown })?.ok === true) {
    return 'conectado'
  }
  return 'no-disponible'
}
