import { z } from 'zod'

/**
 * Esquemas de autenticación. Se usan en el cliente (react-hook-form) y se vuelven a validar en
 * el servidor.
 */

/** bcrypt solo considera los primeros 72 bytes: más largo no aporta y permite abusos de CPU. */
export const CLAVE_MAX = 72
export const CLAVE_MIN = 8

export const emailSchema = z
  .string({ error: 'Correo electrónico requerido' })
  .trim()
  .min(1, 'Correo electrónico requerido')
  .max(254, 'Correo demasiado largo')
  .pipe(z.email('Dirección de correo inválida'))
  .transform((email) => email.toLowerCase())

export const claveNuevaSchema = z
  .string({ error: 'La contraseña es requerida' })
  .min(CLAVE_MIN, `La contraseña debe tener al menos ${CLAVE_MIN} caracteres`)
  .max(CLAVE_MAX, `La contraseña no puede tener más de ${CLAVE_MAX} caracteres`)

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Contraseña requerida.' })
    .min(1, 'Contraseña requerida.')
    .max(CLAVE_MAX, 'Contraseña demasiado larga'),
})
export type LoginInput = z.input<typeof loginSchema>

export const recuperarClaveSchema = z.object({ email: emailSchema })
export type RecuperarClaveInput = z.input<typeof recuperarClaveSchema>

export const restablecerClaveSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/, 'Enlace inválido'),
    password: claveNuevaSchema,
    confirmPassword: z.string({ error: 'Por favor, confirme su contraseña' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  })
export type RestablecerClaveInput = z.input<typeof restablecerClaveSchema>

/**
 * Solo se acepta volver a rutas internas (evita redirecciones abiertas con `callbackUrl`).
 */
export function rutaInternaSegura(valor: unknown, porDefecto = '/dashboard') {
  if (typeof valor !== 'string') return porDefecto
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return porDefecto
  return valor
}
