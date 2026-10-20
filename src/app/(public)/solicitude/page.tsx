import { BannerFormulario } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { FormularioPublico } from '@/components/site/formulario-publico'
import { NavbarSpacer } from '@/components/site/navbar'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Solicitud de registro de clientes',
  descripcion:
    'Si ya eres cliente de Asesorías Valdivia, solicita tu usuario para acceder al panel de clientes.',
  ruta: '/solicitude',
})

export default function SolicitudPage() {
  return (
    <FondoDegradado>
      <NavbarSpacer />
      <BannerFormulario
        titulo="SOLICITUD DE REGISTRO"
        subtitulo="CLIENTES"
        icono
        className="[&>div]:pt-40 md:[&>div]:pt-80 lg:[&>div]:pt-96"
        tituloClassName="text-3xl tracking-[0.5rem] text-brand-green md:text-5xl lg:text-7xl"
      />
      <div className="mt-4">
        <h2 className="mt-6 mb-6 p-4 text-left text-lg font-bold text-brand-blue md:text-2xl">
          Si ya eres cliente, completa el siguiente formulario para crear tu registro.
        </h2>
        <FormularioPublico tipo="contacto" origen="solicitud_registro" />
      </div>
    </FondoDegradado>
  )
}
