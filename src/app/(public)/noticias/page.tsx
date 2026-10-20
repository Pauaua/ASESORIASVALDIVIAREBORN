import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { BannerNoticias, GrillaNoticias } from '@/components/site/noticias'
import { listarNoticiasPublicadas } from '@/lib/data/noticias'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Noticias',
  descripcion:
    'Mantente informado con las últimas noticias contables, tributarias y laborales de Asesorías Valdivia.',
  ruta: '/noticias',
})

async function Listado({ searchParams }: Pick<PageProps<'/noticias'>, 'searchParams'>) {
  const valor = (await searchParams).pagina
  const pagina = Math.max(1, Number(Array.isArray(valor) ? valor[0] : valor) || 1)
  const { noticias, paginas } = await listarNoticiasPublicadas(pagina)

  if (noticias.length === 0) {
    return <p className="py-12 text-center text-brand-blue">Pronto publicaremos nuevas noticias.</p>
  }

  const enlace =
    'inline-flex items-center gap-1 rounded-full bg-brand-blue px-4 py-2 text-white hover:bg-brand-green hover:text-brand-blue'
  return (
    <>
      <GrillaNoticias noticias={noticias} />
      {paginas > 1 && (
        <nav
          aria-label="Paginación de noticias"
          className="mt-8 flex items-center justify-center gap-4"
        >
          {pagina > 1 && (
            <Link
              href={pagina === 2 ? '/noticias' : `/noticias?pagina=${pagina - 1}`}
              className={enlace}
            >
              <ChevronLeft className="size-4" aria-hidden="true" /> Más recientes
            </Link>
          )}
          <span className="text-brand-blue">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <Link href={`/noticias?pagina=${pagina + 1}`} className={enlace}>
              Anteriores <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </>
  )
}

export default function NoticiasPage({ searchParams }: PageProps<'/noticias'>) {
  return (
    <FondoDegradado>
      <BannerNoticias />
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={<p className="py-12 text-center text-brand-blue">Cargando noticias…</p>}
        >
          <Listado searchParams={searchParams} />
        </Suspense>
      </div>
    </FondoDegradado>
  )
}
