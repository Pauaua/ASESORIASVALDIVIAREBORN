import type { Metadata } from 'next'
import { AccesosHome } from '@/components/site/accesos-home'
import { BannerEstatico } from '@/components/site/banners'
import { ClientesMarquee } from '@/components/site/clientes-marquee'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { HeroCarousel } from '@/components/site/hero-carousel'
import { ServiciosHome } from '@/components/site/servicios-home'
import { WhatsAppButton } from '@/components/site/whatsapp-button'
import { metadataPagina } from '@/lib/seo'

const base = metadataPagina({
  titulo: 'Contabilidad, Tributaria y Laboral en Antofagasta',
  descripcion:
    'Expertos en asesoría contable, tributaria, laboral y auditorías en Antofagasta, Chile. Confíe su empresa a profesionales con experiencia.',
  ruta: '/',
})

export const metadata: Metadata = {
  ...base,
  title: { absolute: 'Asesorías Valdivia — Contabilidad, Tributaria y Laboral en Antofagasta' },
}

export default function HomePage() {
  return (
    <FondoDegradado>
      <HeroCarousel />
      <ServiciosHome />
      <AccesosHome />
      <ClientesMarquee />
      <BannerEstatico />
      <WhatsAppButton />
    </FondoDegradado>
  )
}
