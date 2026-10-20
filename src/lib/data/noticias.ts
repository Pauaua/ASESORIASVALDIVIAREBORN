import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'

/** Etiqueta de caché de todo lo público de noticias; las acciones del panel la invalidan. */
export const TAG_NOTICIAS = 'noticias'
export const NOTICIAS_POR_PAGINA = 9

const SELECT_TARJETA = {
  slug: true,
  title: true,
  publishedAt: true,
  image: true,
  imageAlt: true,
  excerpt: true,
} as const

/* -------- Sitio público (cacheado; solo noticias publicadas) -------- */

export async function listarNoticiasPublicadas(pagina: number) {
  'use cache'
  cacheTag(TAG_NOTICIAS)
  cacheLife('hours')
  const where = { published: true }
  const [total, noticias] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({
      where,
      select: SELECT_TARJETA,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      skip: (pagina - 1) * NOTICIAS_POR_PAGINA,
      take: NOTICIAS_POR_PAGINA,
    }),
  ])
  return { total, noticias, paginas: Math.max(1, Math.ceil(total / NOTICIAS_POR_PAGINA)) }
}

export async function obtenerNoticiaPublicada(slug: string) {
  'use cache'
  cacheTag(TAG_NOTICIAS)
  cacheLife('hours')
  return db.post.findFirst({
    where: { slug, published: true },
    select: { ...SELECT_TARJETA, content: true, sources: true, updatedAt: true },
  })
}

/** Slugs publicados (para generateStaticParams y el sitemap). */
export async function slugsPublicados() {
  'use cache'
  cacheTag(TAG_NOTICIAS)
  cacheLife('hours')
  return db.post.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })
}

/* -------- Panel (sin caché) -------- */

export function listarNoticiasAdmin() {
  return db.post.findMany({
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
      published: true,
      author: { select: { name: true, lastname: true } },
    },
  })
}

export function obtenerNoticia(id: number) {
  return db.post.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
      image: true,
      imageAlt: true,
      excerpt: true,
      content: true,
      sources: true,
      published: true,
    },
  })
}
