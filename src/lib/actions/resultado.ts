import 'server-only'
import { unstable_rethrow } from 'next/navigation'
import type { z } from 'zod'
import { ErrorAutorizacion } from '@/lib/session'

/**
 * Respuesta común de las Server Actions del panel. `status` sigue la semántica HTTP (400, 401,
 * 403, 404, 409, 500) para que las pruebas y la UI distingan los casos sin parsear mensajes.
 */
export type Resultado<T = undefined> =
  | { ok: true; data: T; mensaje?: string }
  | {
      ok: false
      status: 400 | 401 | 403 | 404 | 409 | 500 | 502 | 503
      error: string
      fieldErrors?: Record<string, string[] | undefined>
    }

export type Fallo = Extract<Resultado, { ok: false }>

export function exito(mensaje?: string): Resultado
export function exito<T>(mensaje: string | undefined, data: T): Resultado<T>
export function exito<T>(mensaje?: string, data?: T): Resultado<T | undefined> {
  return { ok: true, data, mensaje }
}

export function fallo(
  status: Fallo['status'],
  error: string,
  fieldErrors?: Fallo['fieldErrors'],
): Fallo {
  return { ok: false, status, error, fieldErrors }
}

export function falloValidacion(error: z.ZodError): Fallo {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || '_'
    ;(fieldErrors[campo] ??= []).push(issue.message)
  }
  return fallo(400, 'Revisa los campos marcados.', fieldErrors)
}

/**
 * Ejecuta el cuerpo de una acción y traduce los errores: ErrorAutorizacion → 401/403, cualquier
 * otro → 500 genérico (registrado sin datos personales). Las redirecciones de Next se relanzan.
 */
export async function ejecutar<T>(
  etiqueta: string,
  cuerpo: () => Promise<Resultado<T>>,
): Promise<Resultado<T>> {
  try {
    return await cuerpo()
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ErrorAutorizacion) return fallo(error.status, error.message)
    console.error(`[accion:${etiqueta}] ${(error as Error)?.name ?? 'Error'}`)
    return fallo(500, 'Ocurrió un error inesperado. Inténtalo de nuevo.')
  }
}
