import type { MetadataRoute } from 'next'
import { noticias as noticiasIniciales } from '@/content/noticias'
import { sitio } from '@/content/sitio'
import { slugsPublicados } from '@/lib/data/noticias'

const PAGINAS: { ruta: string; prioridad: number; frecuencia: 'weekly' | 'monthly' | 'yearly' }[] =
  [
    { ruta: '/', prioridad: 1, frecuencia: 'monthly' },
    { ruta: '/servicios', prioridad: 0.9, frecuencia: 'monthly' },
    { ruta: '/nosotros', prioridad: 0.8, frecuencia: 'monthly' },
    { ruta: '/cotiza', prioridad: 0.8, frecuencia: 'yearly' },
    { ruta: '/contacto', prioridad: 0.8, frecuencia: 'yearly' },
    { ruta: '/noticias', prioridad: 0.7, frecuencia: 'weekly' },
    { ruta: '/misionvision', prioridad: 0.5, frecuencia: 'yearly' },
    { ruta: '/solicitude', prioridad: 0.4, frecuencia: 'yearly' },
    { ruta: '/privacidad', prioridad: 0.2, frecuencia: 'yearly' },
    { ruta: '/terminosdeuso', prioridad: 0.2, frecuencia: 'yearly' },
  ]

/** Noticias publicadas en la base; si no está disponible, las iniciales. */
async function noticias() {
  try {
    return (await slugsPublicados()).map((n) => ({ slug: n.slug, lastModified: n.updatedAt }))
  } catch {
    return noticiasIniciales.map((n) => ({
      slug: n.slug,
      lastModified: new Date(`${n.fecha}T12:00:00Z`),
    }))
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    ...PAGINAS.map((pagina) => ({
      url: `${sitio.url}${pagina.ruta === '/' ? '' : pagina.ruta}`,
      changeFrequency: pagina.frecuencia,
      priority: pagina.prioridad,
    })),
    ...(await noticias()).map((noticia) => ({
      url: `${sitio.url}/noticias/${noticia.slug}`,
      lastModified: noticia.lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ]
}
