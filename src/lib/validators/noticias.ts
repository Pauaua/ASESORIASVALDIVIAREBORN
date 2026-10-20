import { z } from 'zod'
import { esUrlBlob } from '@/lib/subidas'

const requerido = 'Este campo es requerido'

/** "¿Los negocios pueden…?" → "los-negocios-pueden" (sin acentos, minúsculas, máx. 60). */
export function slugificar(texto: string, max = 60) {
  const base = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base.slice(0, max).replace(/-+$/g, '') || 'noticia'
}

const urlHttp = (v: string) => {
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

export const noticiaSchema = z.object({
  title: z.string({ error: requerido }).trim().min(1, requerido).max(200, 'Máximo 200 caracteres'),
  slug: z
    .string()
    .trim()
    .max(80, 'Máximo 80 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, 'Solo minúsculas, números y guiones')
    .nullish()
    .transform((v) => v || null),
  publishedAt: z
    .string({ error: requerido })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .refine((v) => !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime()), 'Fecha inválida'),
  image: z
    .string()
    .trim()
    .max(2048)
    .nullish()
    .transform((v) => v || null)
    .refine(
      (v) => v === null || esUrlBlob(v) || /^\/[\w./-]+\.(jpe?g|png|webp)$/i.test(v),
      'La imagen debe subirse desde el panel',
    ),
  imageAlt: z
    .string()
    .trim()
    .max(200, 'Máximo 200 caracteres')
    .nullish()
    .transform((v) => v || null),
  excerpt: z
    .string({ error: requerido })
    .trim()
    .min(1, requerido)
    .max(300, 'Máximo 300 caracteres'),
  content: z
    .string({ error: requerido })
    .trim()
    .min(1, requerido)
    .max(50_000, 'Contenido demasiado largo'),
  /** Una URL por línea (en el formulario) o un arreglo. */
  sources: z
    .union([z.string(), z.array(z.string())])
    .nullish()
    .transform((v) =>
      (Array.isArray(v) ? v : (v ?? '').split(/\r?\n/)).map((s) => s.trim()).filter(Boolean),
    )
    .refine((v) => v.length <= 20, 'Máximo 20 fuentes')
    .refine((v) => v.every(urlHttp), 'Cada fuente debe ser una URL http(s), una por línea'),
  published: z.boolean().default(false),
})

export type NoticiaInput = z.input<typeof noticiaSchema>
export type NoticiaOutput = z.output<typeof noticiaSchema>
