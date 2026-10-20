import { z } from 'zod'

const requerido = 'Este campo es requerido'

export const TIPOS_ARCHIVO = ['link', 'pdf'] as const
export type TipoArchivo = (typeof TIPOS_ARCHIVO)[number]

export const categoriaSchema = z.object({
  name: z.string({ error: requerido }).trim().min(1, requerido).max(120, 'Máximo 120 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'Máximo 500 caracteres')
    .nullish()
    .transform((v) => (v ? v : null)),
})
export type CategoriaInput = z.input<typeof categoriaSchema>
export type CategoriaOutput = z.output<typeof categoriaSchema>

/** Solo URL http(s): evita `javascript:` y similares en los enlaces que ven los clientes. */
export const urlHttpSchema = z
  .string({ error: requerido })
  .trim()
  .min(1, requerido)
  .max(2048, 'URL demasiado larga')
  .refine((v) => {
    try {
      const u = new URL(v)
      return u.protocol === 'https:' || u.protocol === 'http:'
    } catch {
      return false
    }
  }, 'Debe ser una URL que empiece con http:// o https://')

export const archivoSchema = z.object({
  name: z.string({ error: requerido }).trim().min(1, requerido).max(200, 'Máximo 200 caracteres'),
  url: urlHttpSchema,
  type: z.enum(TIPOS_ARCHIVO, { error: 'Tipo inválido' }),
  resourceId: z.coerce
    .number({ error: 'Elige una categoría' })
    .int()
    .positive('Elige una categoría'),
})
export type ArchivoInput = z.input<typeof archivoSchema>
export type ArchivoOutput = z.output<typeof archivoSchema>
