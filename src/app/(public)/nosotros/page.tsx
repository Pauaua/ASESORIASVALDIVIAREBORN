import { BannerCierre } from '@/components/site/banners'
import { ClientesMarquee } from '@/components/site/clientes-marquee'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { SobreNosotros, Valores } from '@/components/site/nosotros'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Quiénes Somos',
  descripcion:
    'Conoce al equipo de Asesorías Valdivia: profesionales comprometidos con la excelencia en asesoría contable, tributaria y laboral en Antofagasta, Chile.',
  ruta: '/nosotros',
})

export default function NosotrosPage() {
  return (
    <FondoDegradado>
      <SobreNosotros />
      <Valores />
      <ClientesMarquee />
      <BannerCierre />
    </FondoDegradado>
  )
}
