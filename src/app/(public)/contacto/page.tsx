import { BannerClientes, BannerFormulario } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { FormularioPublico } from '@/components/site/formulario-publico'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Contacto',
  descripcion:
    'Contáctanos para resolver tus dudas sobre nuestros servicios de asesoría contable, tributaria y laboral en Antofagasta.',
  ruta: '/contacto',
})

export default function ContactoPage() {
  return (
    <FondoDegradado>
      <BannerFormulario
        titulo="¿TIENES DUDAS?"
        subtitulo="ESCRÍBENOS"
        icono
        tituloClassName="text-xl text-brand-white sm:text-3xl md:text-5xl lg:text-7xl"
      />
      <div className="mt-4">
        <h2 className="mt-6 mb-6 p-4 text-left text-lg font-bold text-brand-blue md:text-2xl">
          Para continuar complete el siguiente formulario:
        </h2>
        <FormularioPublico tipo="contacto" origen="contacto" />
      </div>
      <BannerClientes />
    </FondoDegradado>
  )
}
