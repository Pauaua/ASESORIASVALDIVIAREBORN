import 'server-only'
import type { ReactElement } from 'react'
import { Resend } from 'resend'
import { env } from '@/env'

let client: Resend | undefined

function getResend() {
  if (!env.RESEND_API_KEY) return undefined
  client ??= new Resend(env.RESEND_API_KEY)
  return client
}

export function isEmailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)
}

type SendEmailInput = {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
  /** Etiqueta para identificar el tipo de correo en los logs (sin datos personales). */
  tipo: string
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string }

/**
 * Envía un correo con Resend. Nunca lanza excepciones: devuelve { ok: false } y registra el
 * error SIN datos personales (ni destinatarios ni contenido).
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  tipo,
}: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend()
  if (!resend || !env.EMAIL_FROM) {
    console.warn(`[email:${tipo}] no enviado: correo no configurado (RESEND_API_KEY/EMAIL_FROM)`)
    return { ok: false, error: 'Correo no configurado' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      react,
      replyTo,
    })
    if (error || !data) {
      console.error(`[email:${tipo}] Resend rechazó el envío: ${error?.name ?? 'sin datos'}`)
      return { ok: false, error: error?.message ?? 'Error desconocido' }
    }
    return { ok: true, id: data.id }
  } catch (error) {
    console.error(`[email:${tipo}] error de red: ${(error as Error).name}`)
    return { ok: false, error: 'Error de red' }
  }
}
