import { FondoDegradado } from '@/components/site/fondo-degradado'
import { BannerNoticias, GrillaNoticias } from '@/components/site/noticias'
import { noticias } from '@/content/noticias'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Noticias',
  descripcion:
    'Mantente informado con las últimas noticias contables, tributarias y laborales de Asesorías Valdivia.',
  ruta: '/noticias',
})

export default function NoticiasPage() {
  const ordenadas = [...noticias].sort((a, b) => b.fecha.localeCompare(a.fecha))
  return (
    <FondoDegradado>
      <BannerNoticias />
      <div className="container mx-auto px-4 py-8">
        <GrillaNoticias noticias={ordenadas} />
      </div>
    </FondoDegradado>
  )
}
