import Image from 'next/image'
import { BannerEstatico } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { ServiciosDetalle } from '@/components/site/servicios-detalle'
import { sitio } from '@/content/sitio'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Servicios',
  descripcion:
    'Conoce todos nuestros servicios de asesoría contable, laboral, tributaria y auditorías en Antofagasta, Chile.',
  ruta: '/servicios',
})

export default function ServiciosPage() {
  return (
    <FondoDegradado>
      <section className="relative isolate text-white">
        <Image
          src="/BannerServiciosPage.jpg"
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="p-4 sm:p-8 md:p-16">
          <h1 className="mt-16 py-4 text-2xl font-semibold tracking-[0.3rem] text-brand-white sm:mt-20 sm:py-8 sm:text-4xl md:py-16 md:text-6xl lg:text-8xl">
            NUESTROS SERVICIOS
          </h1>
          <p className="mt-1 py-1 text-base sm:text-xl md:text-3xl lg:text-5xl">
            ¿Buscas empezar tu emprendimiento?
          </p>
          <p className="mt-1 inline-block rounded-lg border-2 border-brand-blue bg-transparent px-2 py-2 text-sm font-bold sm:px-3 sm:text-lg md:px-4 md:text-2xl lg:text-4xl">
            estás en el lugar indicado
          </p>
          <p className="mt-6 pr-4 text-xs leading-relaxed sm:mt-10 sm:pr-10 sm:text-sm md:mt-20 md:pr-20 md:text-lg lg:text-2xl">
            En <b>Asesorías Valdivia</b> ofrecemos servicios integrales de asesoría contable,
            laboral, tributaria y auditoría, diseñados para optimizar la gestión y el cumplimiento
            normativo de tu negocio. Nuestra experiencia garantiza soluciones personalizadas que
            mejoran la eficiencia, previenen problemas y proporcionan información clave para la toma
            de decisiones estratégicas, asegurando así el crecimiento sostenible y la credibilidad
            de tu empresa.
          </p>
          <div className="mt-6 text-left text-sm font-bold sm:text-right sm:text-base md:mt-10 md:text-xl lg:text-2xl">
            <p className="text-brand-white">Contáctanos a:</p>
            <p>
              <a href={`mailto:${sitio.email}`} className="hover:underline">
                {sitio.email}
              </a>
            </p>
            <p>
              o escríbenos al{' '}
              <a href={`tel:${sitio.telefono}`} className="hover:underline">
                {sitio.telefonoVisible}
              </a>
            </p>
          </div>
        </div>
      </section>
      <ServiciosDetalle />
      <BannerEstatico />
    </FondoDegradado>
  )
}
