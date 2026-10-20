import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { Markdown } from '@/components/site/markdown'
import { NavbarSpacer } from '@/components/site/navbar'
import { IMAGEN_NOTICIA_POR_DEFECTO } from '@/components/site/noticias'
import { noticias as noticiasIniciales } from '@/content/noticias'
import { sitio } from '@/content/sitio'
import { obtenerNoticiaPublicada, slugsPublicados } from '@/lib/data/noticias'
import { formatearFecha } from '@/lib/fechas'
import { jsonLd, metadataPagina } from '@/lib/seo'

/**
 * Con Cache Components hay que devolver al menos un slug. Si la base aún no tiene noticias (o no
 * está disponible al compilar), se usan los slugs de las noticias iniciales; el resto se genera
 * al primer acceso.
 */
export async function generateStaticParams() {
  try {
    const slugs = await slugsPublicados()
    if (slugs.length > 0) return slugs.map(({ slug }) => ({ slug }))
  } catch {
    // Sin base al compilar: se usan los slugs iniciales.
  }
  return noticiasIniciales.map(({ slug }) => ({ slug }))
}

/** URL absoluta de la imagen (las sembradas son rutas locales). */
function urlImagen(src: string) {
  return src.startsWith('/') ? `${sitio.url}${src}` : src
}

export async function generateMetadata({
  params,
}: PageProps<'/noticias/[slug]'>): Promise<Metadata> {
  const noticia = await obtenerNoticiaPublicada((await params).slug)
  if (!noticia) return { title: 'Noticia no encontrada', robots: { index: false } }
  return metadataPagina({
    titulo: noticia.title,
    descripcion: noticia.excerpt,
    ruta: `/noticias/${noticia.slug}`,
    tipo: 'article',
    imagen: noticia.image
      ? {
          url: urlImagen(noticia.image),
          width: 1200,
          height: 675,
          alt: noticia.imageAlt ?? noticia.title,
        }
      : undefined,
  })
}

function nombreFuente(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

async function Articulo({ params }: Pick<PageProps<'/noticias/[slug]'>, 'params'>) {
  const noticia = await obtenerNoticiaPublicada((await params).slug)
  if (!noticia) notFound()
  const fecha = noticia.publishedAt.toISOString().slice(0, 10)

  const articulo = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: noticia.title,
    description: noticia.excerpt,
    datePublished: fecha,
    dateModified: noticia.updatedAt.toISOString(),
    image: [urlImagen(noticia.image ?? IMAGEN_NOTICIA_POR_DEFECTO)],
    inLanguage: 'es-CL',
    mainEntityOfPage: `${sitio.url}/noticias/${noticia.slug}`,
    author: { '@type': 'Organization', name: sitio.nombre, url: sitio.url },
    publisher: { '@id': `${sitio.url}/#organizacion` },
    ...(noticia.sources.length ? { citation: noticia.sources } : {}),
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6 md:p-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articulo)} />
      <h1 className="mb-2 text-2xl font-bold text-brand-blue sm:text-3xl">{noticia.title}</h1>
      <p className="mb-6 text-brand-blue">
        <time dateTime={fecha}>{formatearFecha(noticia.publishedAt)}</time>
      </p>
      <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg">
        <Image
          src={noticia.image ?? IMAGEN_NOTICIA_POR_DEFECTO}
          alt={noticia.imageAlt ?? ''}
          fill
          preload
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="text-base text-gray-800 sm:text-lg">
        <Markdown>{noticia.content}</Markdown>
      </div>
      {noticia.sources.length > 0 && (
        <section aria-labelledby="fuentes" className="mt-8 border-t pt-4 text-sm">
          <h2 id="fuentes" className="mb-2 font-semibold text-brand-blue">
            Fuentes
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            {noticia.sources.map((fuente) => (
              <li key={fuente}>
                <a
                  href={fuente}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand-blue underline"
                >
                  {nombreFuente(fuente)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default function NoticiaPage({ params }: PageProps<'/noticias/[slug]'>) {
  return (
    <FondoDegradado>
      <NavbarSpacer />
      <article className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/noticias"
          className="mb-6 inline-flex items-center gap-2 text-brand-blue hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a noticias
        </Link>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white/70" />}>
          <Articulo params={params} />
        </Suspense>
      </article>
    </FondoDegradado>
  )
}
