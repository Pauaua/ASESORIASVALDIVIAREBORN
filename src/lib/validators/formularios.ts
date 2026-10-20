import { z } from 'zod'
import { SERVICIO_IDS } from '@/content/servicios'

/**
 * Esquemas de los formularios públicos. Se usan en el cliente (react-hook-form) y se vuelven a
 * validar en el servidor (Server Actions): el cliente nunca es la única barrera.
 */

const requerido = 'Este campo es requerido'

const texto = (max: number) =>
  z.string({ error: requerido }).trim().min(1, requerido).max(max, `Máximo ${max} caracteres`)

const camposComunes = {
  nombre: texto(100),
  apellido: texto(100),
  correo: z
    .string({ error: requerido })
    .trim()
    .min(1, requerido)
    .max(254, 'Correo demasiado largo')
    .pipe(z.email('Correo electrónico inválido'))
    .transform((correo) => correo.toLowerCase()),
  telefono: z
    .string()
    .trim()
    .max(20, 'Máximo 20 dígitos')
    .regex(/^[0-9]*$/, 'Por favor, ingrese solo números')
    .optional()
    .transform((telefono) => (telefono ? telefono : undefined)),
  mensaje: texto(2000),
}

/** Campos anti-spam que no ve la persona: honeypot y momento en que se cargó el formulario. */
export const antiSpamSchema = z.object({
  /** Debe llegar vacío: los bots suelen rellenar todos los campos. */
  sitioWeb: z.string().max(0).optional().or(z.literal('')),
  /** Date.now() al montar el formulario; un envío en menos de 3 s se considera automático. */
  cargadoEn: z.coerce.number().int().positive(),
  /** Token de Cloudflare Turnstile (solo si está configurado). */
  turnstileToken: z.string().max(4096).optional(),
})

export const contactoSchema = z.object(camposComunes)
export type ContactoInput = z.input<typeof contactoSchema>

export const cotizacionSchema = z.object({
  ...camposComunes,
  servicio: z.enum(SERVICIO_IDS, { error: requerido }),
})
export type CotizacionInput = z.input<typeof cotizacionSchema>

/** Origen de un formulario de "ContactForm". */
export const ORIGENES = ['contacto', 'solicitud_registro'] as const
export type Origen = (typeof ORIGENES)[number]
