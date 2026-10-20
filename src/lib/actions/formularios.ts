'use server'

import { after } from 'next/server'
import { z } from 'zod'
import { nombreServicio } from '@/content/servicios'
import { db } from '@/lib/db'
import { notifyInternal, sendAcuseRecibo } from '@/lib/email/notificaciones'
import { RATE_LIMITS, rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'
import { verifyTurnstile } from '@/lib/turnstile'
import {
  antiSpamSchema,
  contactoSchema,
  cotizacionSchema,
  ORIGENES,
} from '@/lib/validators/formularios'

export type ResultadoFormulario =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }

/** Envíos más rápidos que esto (desde que se cargó el formulario) se consideran automáticos. */
const TIEMPO_MINIMO_MS = 3000

const ERROR_GENERICO = 'Hubo un error al enviar el formulario. Por favor, inténtelo de nuevo.'

/**
 * Filtros comunes: honeypot, tiempo mínimo, rate limit por IP y Turnstile (si está configurado).
 * Devuelve `bot: true` cuando el envío parece automático: en ese caso se responde "éxito" sin
 * guardar nada, para no darle pistas al bot.
 */
async function filtrarSpam(
  input: unknown,
): Promise<{ bot: true } | { bot: false; error?: string }> {
  const antiSpam = antiSpamSchema.safeParse(input)
  if (!antiSpam.success) return { bot: true }
  if (antiSpam.data.sitioWeb) return { bot: true }
  if (Date.now() - antiSpam.data.cargadoEn < TIEMPO_MINIMO_MS) return { bot: true }

  const ip = await getClientIp()
  const limite = await rateLimit(RATE_LIMITS.formularioPublico, ip)
  if (!limite.ok) {
    return {
      bot: false,
      error: 'Has enviado varios formularios seguidos. Espera unos minutos e inténtalo de nuevo.',
    }
  }

  if (!(await verifyTurnstile(antiSpam.data.turnstileToken, ip))) {
    return { bot: false, error: 'No pudimos verificar que no eres un robot. Recarga la página.' }
  }
  return { bot: false }
}

function erroresDeCampo(error: z.ZodError) {
  return {
    ok: false as const,
    error: 'Revisa los campos marcados.',
    fieldErrors: z.flattenError(error).fieldErrors,
  }
}

const contactoConOrigenSchema = contactoSchema.extend({ origen: z.enum(ORIGENES) })

/** Formularios de /contacto (origen "contacto") y /solicitude (origen "solicitud_registro"). */
export async function enviarContacto(input: unknown): Promise<ResultadoFormulario> {
  try {
    const spam = await filtrarSpam(input)
    if (spam.bot) return { ok: true }
    if (spam.error) return { ok: false, error: spam.error }

    const parsed = contactoConOrigenSchema.safeParse(input)
    if (!parsed.success) return erroresDeCampo(parsed.error)
    const { origen, ...datos } = parsed.data

    await db.contactForm.create({ data: { ...datos, telefono: datos.telefono ?? null, origen } })

    // Los correos se envían después de responder: un fallo de correo no afecta al visitante.
    const tipo = origen === 'solicitud_registro' ? 'solicitud_registro' : 'contacto'
    after(async () => {
      await notifyInternal({ tipo, ...datos })
      await sendAcuseRecibo({ tipo, nombre: datos.nombre, correo: datos.correo })
    })

    return { ok: true }
  } catch (error) {
    console.error('[formularios:contacto] error al guardar:', (error as Error).name)
    return { ok: false, error: ERROR_GENERICO }
  }
}

/** Formulario de /cotiza. */
export async function enviarCotizacion(input: unknown): Promise<ResultadoFormulario> {
  try {
    const spam = await filtrarSpam(input)
    if (spam.bot) return { ok: true }
    if (spam.error) return { ok: false, error: spam.error }

    const parsed = cotizacionSchema.safeParse(input)
    if (!parsed.success) return erroresDeCampo(parsed.error)
    const datos = parsed.data

    await db.cotizationForm.create({ data: { ...datos, telefono: datos.telefono ?? null } })

    after(async () => {
      await notifyInternal({
        tipo: 'cotizacion',
        ...datos,
        servicio: nombreServicio(datos.servicio),
      })
      await sendAcuseRecibo({ tipo: 'cotizacion', nombre: datos.nombre, correo: datos.correo })
    })

    return { ok: true }
  } catch (error) {
    console.error('[formularios:cotizacion] error al guardar:', (error as Error).name)
    return { ok: false, error: ERROR_GENERICO }
  }
}
