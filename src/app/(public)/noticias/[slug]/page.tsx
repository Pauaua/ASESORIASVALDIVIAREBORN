import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { NavbarSpacer } from '@/components/site/navbar'
import { noticias } from '@/content/noticias'
import { sitio } from '@/content/sitio'
import { formatearFecha } from '@/lib/fechas'
import { jsonLd, metadataPagina } from '@/lib/seo'

function buscar(slug: string) {
  return noticias.find((noticia) => noticia.slug === slug)
}

export function generateStaticParams() {
  return noticias.map((noticia) => ({ slug: noticia.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/noticias/[slug]'>): Promise<Metadata> {
  const noticia = buscar((await params).slug)
  if (!noticia) return {}
  const descripcion = noticia.parrafos[0]?.slice(0, 155).replace(/\s+\S*$/, '…') ?? ''
  return metadataPagina({
    titulo: noticia.titulo,
    descripcion,
    ruta: `/noticias/${noticia.slug}`,
    tipo: 'article',
    imagen: { url: noticia.imagen.src, ...noticia.imagen, alt: noticia.titulo },
  })
}

export default async function NoticiaPage({ params }: PageProps<'/noticias/[slug]'>) {
  const noticia = buscar((await params).slug)
  if (!noticia) notFound()

  const articulo = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: noticia.titulo,
    datePublished: noticia.fecha,
    image: [`${sitio.url}${noticia.imagen.src}`],
    inLanguage: 'es-CL',
    mainEntityOfPage: `${sitio.url}/noticias/${noticia.slug}`,
    author: { '@type': 'Organization', name: sitio.nombre, url: sitio.url },
    publisher: { '@id': `${sitio.url}/#organizacion` },
    ...(noticia.fuentes.length ? { citation: noticia.fuentes } : {}),
  }

  return (
    <FondoDegradado>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articulo)} />
      <NavbarSpacer />
      <article className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/noticias"
          className="mb-6 inline-flex items-center gap-2 text-brand-blue hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a noticias
        </Link>
        <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6 md:p-10">
          <h1 className="mb-2 text-2xl font-bold text-brand-blue sm:text-3xl">{noticia.titulo}</h1>
          <p className="mb-6 text-brand-blue">
            <time dateTime={noticia.fecha}>{formatearFecha(noticia.fecha)}</time>
          </p>
          <Image
            src={noticia.imagen.src}
            alt=""
            width={noticia.imagen.width}
            height={noticia.imagen.height}
            preload
            sizes="(min-width: 768px) 720px, 100vw"
            className="mb-6 h-auto max-h-96 w-full rounded-lg object-cover"
          />
          <div className="space-y-4 text-base text-gray-800 sm:text-lg">
            {noticia.parrafos.map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
          {noticia.fuentes.length > 0 && (
            <section aria-labelledby="fuentes" className="mt-8 border-t pt-4 text-sm">
              <h2 id="fuentes" className="mb-2 font-semibold text-brand-blue">
                Fuentes
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                {noticia.fuentes.map((fuente) => (
                  <li key={fuente}>
                    <a
                      href={fuente}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-brand-blue underline"
                    >
                      {new URL(fuente).hostname.replace(/^www\./, '')}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
    </FondoDegradado>
  )
}
