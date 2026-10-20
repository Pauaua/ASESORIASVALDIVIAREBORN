'use server'

import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { env } from '@/env'
import RecuperarClave from '@/emails/recuperar-clave'
import { signIn, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/send'
import { RATE_LIMITS, rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'
import {
  loginSchema,
  recuperarClaveSchema,
  restablecerClaveSchema,
  rutaInternaSegura,
} from '@/lib/validators/auth'

export type ResultadoAuth = { ok: true; mensaje?: string } | { ok: false; error: string }

const ERROR_CREDENCIALES = 'Correo o contraseña incorrectos.'
const ERROR_DESACTIVADA = 'Tu cuenta está desactivada. Contacta a Asesorías Valdivia.'
const ERROR_LIMITE = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
const ERROR_GENERICO = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.'

/** Login con correo y contraseña. Si tiene éxito redirige (no retorna). */
export async function iniciarSesion(input: unknown, callbackUrl?: string): Promise<ResultadoAuth> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: ERROR_CREDENCIALES }
  const { email, password } = parsed.data

  // Límite por IP y por cuenta: frena tanto el barrido de correos como el ataque a una cuenta.
  const ip = await getClientIp()
  const [porIp, porCuenta] = await Promise.all([
    rateLimit(RATE_LIMITS.login, `ip:${ip}`),
    rateLimit(RATE_LIMITS.login, `email:${email}`),
  ])
  if (!porIp.ok || !porCuenta.ok) return { ok: false, error: ERROR_LIMITE }

  try {
    await signIn('credentials', { email, password, redirectTo: rutaInternaSegura(callbackUrl) })
    return { ok: true }
  } catch (error) {
    if (error instanceof AuthError) {
      if ('code' in error && error.code === 'cuenta_desactivada') {
        return { ok: false, error: ERROR_DESACTIVADA }
      }
      return { ok: false, error: ERROR_CREDENCIALES }
    }
    // La redirección de Next se implementa con una excepción: hay que dejarla pasar.
    throw error
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: '/' })
}

const MENSAJE_RECUPERACION =
  'Si la cuenta con el correo existe, se enviará el enlace para resetear la contraseña.'

/** Hash SHA-256 del token: en la BD nunca se guarda el token en claro. */
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** Solicitud de recuperación. Responde siempre lo mismo para no revelar si el correo existe. */
export async function solicitarRecuperacion(input: unknown): Promise<ResultadoAuth> {
  const parsed = recuperarClaveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'El correo electrónico no es válido' }
  const { email } = parsed.data

  const ip = await getClientIp()
  const [porIp, porCuenta] = await Promise.all([
    rateLimit(RATE_LIMITS.recuperarClave, `ip:${ip}`),
    rateLimit(RATE_LIMITS.recuperarClave, `email:${email}`),
  ])
  if (!porIp.ok || !porCuenta.ok) return { ok: false, error: ERROR_LIMITE }

  try {
    const usuario = await db.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, name: true },
    })
    if (!usuario) return { ok: true, mensaje: MENSAJE_RECUPERACION }

    const token = randomBytes(32).toString('hex')
    await db.user.update({
      where: { id: usuario.id },
      data: { resetToken: hashToken(token), resetTokenExpires: new Date(Date.now() + 3600_000) },
    })

    const enlace = `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
    const envio = await sendEmail({
      tipo: 'recuperar-clave',
      to: usuario.email,
      subject: 'Restablece tu contraseña — Asesorías Valdivia',
      react: (
        <RecuperarClave appUrl={env.NEXT_PUBLIC_APP_URL} nombre={usuario.name} enlace={enlace} />
      ),
    })

    // Si el correo no salió, el token no sirve de nada: se revierte. La respuesta sigue siendo
    // la misma para no revelar que la cuenta existe.
    if (!envio.ok) {
      await db.user.update({
        where: { id: usuario.id },
        data: { resetToken: null, resetTokenExpires: null },
      })
    }
    return { ok: true, mensaje: MENSAJE_RECUPERACION }
  } catch (error) {
    console.error(`[auth:recuperar] ${(error as Error).name}`)
    return { ok: false, error: ERROR_GENERICO }
  }
}

/** Fija la nueva contraseña si el token es válido y no venció. */
export async function restablecerClave(input: unknown): Promise<ResultadoAuth> {
  const parsed = restablecerClaveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const { token, password } = parsed.data

  const ip = await getClientIp()
  if (!(await rateLimit(RATE_LIMITS.recuperarClave, `reset:${ip}`)).ok) {
    return { ok: false, error: ERROR_LIMITE }
  }

  try {
    const usuario = await db.user.findFirst({
      where: { resetToken: hashToken(token), resetTokenExpires: { gt: new Date() } },
      select: { id: true },
    })
    if (!usuario) return { ok: false, error: 'Token inválido o expirado' }

    await db.user.update({
      where: { id: usuario.id },
      data: {
        password: await bcrypt.hash(password, 10),
        resetToken: null,
        resetTokenExpires: null,
      },
    })
    return { ok: true, mensaje: 'Tu contraseña ha sido reseteada correctamente.' }
  } catch (error) {
    console.error(`[auth:restablecer] ${(error as Error).name}`)
    return { ok: false, error: 'Ha ocurrido un error al resetear tu contraseña' }
  }
}
