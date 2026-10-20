'use server'

import { refresh, updateTag } from 'next/cache'
import { borrarBlob } from '@/lib/blob'
import { db } from '@/lib/db'
import { TAG_NOTICIAS } from '@/lib/data/noticias'
import { requirePermiso } from '@/lib/session'
import { noticiaSchema, slugificar } from '@/lib/validators/noticias'
import { idSchema } from '@/lib/validators/usuarios'
import { ejecutar, exito, fallo, falloValidacion, type Resultado } from './resultado'

/* Todas las acciones de noticias son solo para ADMIN ('noticias.administrar'). */

/** Slug libre: el pedido (o el del título) y, si está ocupado, con sufijo -2, -3… */
async function slugDisponible(base: string, excluirId?: number) {
  for (let i = 1; i < 100; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    const ocupado = await db.post.findFirst({
      where: { slug, ...(excluirId ? { id: { not: excluirId } } : {}) },
      select: { id: true },
    })
    if (!ocupado) return slug
  }
  return `${base}-${Date.now()}`
}

function invalidar() {
  // Actualiza /noticias, /noticias/[slug] y el sitemap; refresh() el panel.
  updateTag(TAG_NOTICIAS)
  refresh()
}

export async function crearNoticia(input: unknown): Promise<Resultado<{ id: number }>> {
  return ejecutar('crearNoticia', async () => {
    const yo = await requirePermiso('noticias.administrar')
    const parsed = noticiaSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const { slug, publishedAt, ...datos } = parsed.data

    const creada = await db.post.create({
      data: {
        ...datos,
        slug: await slugDisponible(slug ?? slugificar(datos.title)),
        publishedAt: new Date(`${publishedAt}T12:00:00Z`),
        authorId: yo.id,
      },
      select: { id: true },
    })
    invalidar()
    return exito(datos.published ? 'Noticia publicada.' : 'Borrador guardado.', { id: creada.id })
  })
}

export async function editarNoticia(idInput: unknown, input: unknown): Promise<Resultado> {
  return ejecutar('editarNoticia', async () => {
    await requirePermiso('noticias.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Noticia inválida.')
    const parsed = noticiaSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const { slug, publishedAt, ...datos } = parsed.data

    const anterior = await db.post.findUnique({
      where: { id: id.data },
      select: { slug: true, image: true },
    })
    if (!anterior) return fallo(404, 'La noticia no existe.')

    await db.post.update({
      where: { id: id.data },
      data: {
        ...datos,
        slug: await slugDisponible(slug ?? anterior.slug, id.data),
        publishedAt: new Date(`${publishedAt}T12:00:00Z`),
      },
      select: { id: true },
    })
    if (anterior.image && anterior.image !== datos.image) await borrarBlob(anterior.image)
    invalidar()
    return exito('Noticia actualizada.')
  })
}

export async function cambiarPublicacion(idInput: unknown, publicada: unknown): Promise<Resultado> {
  return ejecutar('cambiarPublicacion', async () => {
    await requirePermiso('noticias.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success || typeof publicada !== 'boolean') return fallo(400, 'Datos inválidos.')
    const r = await db.post.updateMany({ where: { id: id.data }, data: { published: publicada } })
    if (r.count === 0) return fallo(404, 'La noticia no existe.')
    invalidar()
    return exito(publicada ? 'Noticia publicada.' : 'Noticia despublicada (borrador).')
  })
}

export async function eliminarNoticia(idInput: unknown): Promise<Resultado> {
  return ejecutar('eliminarNoticia', async () => {
    await requirePermiso('noticias.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Noticia inválida.')
    const noticia = await db.post.findUnique({ where: { id: id.data }, select: { image: true } })
    if (!noticia) return fallo(404, 'La noticia no existe.')
    await db.post.delete({ where: { id: id.data } })
    await borrarBlob(noticia.image)
    invalidar()
    return exito('Noticia eliminada.')
  })
}
