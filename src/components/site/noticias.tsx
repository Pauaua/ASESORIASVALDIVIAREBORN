import Image from 'next/image'
import Link from 'next/link'
import { formatearFecha } from '@/lib/fechas'

/** Banner de /noticias. */
export function BannerNoticias() {
  return (
    <section className="relative h-[200px] w-full overflow-hidden sm:h-[300px] md:h-[400px] lg:h-[500px]">
      <Image src="/bannernoticias.jpg" alt="" fill preload sizes="100vw" className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 p-4 backdrop-blur-sm sm:p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="py-4 text-3xl font-semibold text-brand-white md:text-4xl lg:text-5xl">
            NOTICIAS
          </h1>
          <p className="pb-6 text-sm text-brand-white sm:text-base md:text-lg lg:text-xl">
            Aquí podrás encontrar novedades para ti y tu empresa o emprendimiento.
          </p>
        </div>
      </div>
    </section>
  )
}

export type TarjetaNoticia = {
  slug: string
  title: string
  publishedAt: Date
  image: string | null
  excerpt: string
}

/** Imagen por defecto para noticias sin imagen propia. */
export const IMAGEN_NOTICIA_POR_DEFECTO = '/bannernoticias.jpg'

/** Grilla de tarjetas de noticias; cada una enlaza a su página. */
export function GrillaNoticias({ noticias }: { noticias: readonly TarjetaNoticia[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {noticias.map((noticia) => (
        <li key={noticia.slug}>
          <Link
            href={`/noticias/${noticia.slug}`}
            className="block h-full overflow-hidden rounded-2xl bg-brand-blue transition duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand-green motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <div className="relative h-48">
              <Image
                src={noticia.image ?? IMAGEN_NOTICIA_POR_DEFECTO}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover brightness-75"
              />
            </div>
            <div className="p-4">
              <h2 className="mb-2 text-lg font-semibold text-brand-white">{noticia.title}</h2>
              <p className="text-sm text-brand-white">
                <time dateTime={noticia.publishedAt.toISOString().slice(0, 10)}>
                  {formatearFecha(noticia.publishedAt)}
                </time>
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
