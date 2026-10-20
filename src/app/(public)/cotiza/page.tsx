import { BannerCierre, BannerFormulario } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { FormularioPublico } from '@/components/site/formulario-publico'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Cotiza',
  descripcion:
    'Solicita una cotización para nuestros servicios de asesoría contable, tributaria, laboral y auditorías.',
  ruta: '/cotiza',
})

export default function CotizaPage() {
  return (
    <FondoDegradado>
      <BannerFormulario
        titulo="¿INTERESADO EN NUESTROS SERVICIOS?"
        subtitulo="ESCRÍBENOS"
        tituloClassName="text-base tracking-[0.2rem] text-brand-green sm:text-2xl md:text-4xl lg:text-6xl"
      />
      <div className="mt-4">
        <h2 className="mt-6 mb-6 p-4 text-left text-lg font-bold text-brand-blue md:text-2xl">
          Para continuar complete el siguiente formulario:
        </h2>
        <FormularioPublico tipo="cotizacion" />
      </div>
      <BannerCierre />
    </FondoDegradado>
  )
}
