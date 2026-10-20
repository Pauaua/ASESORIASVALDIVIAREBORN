import { EncabezadoPagina } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { NavbarSpacer } from '@/components/site/navbar'
import { TextoLegal } from '@/components/site/texto-legal'
import { terminosDeUso } from '@/content/legal/terminos-de-uso'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Aviso legal y Términos de Uso',
  descripcion:
    'Aviso legal, términos de uso y condiciones de venta del sitio de Asesorías Valdivia.',
  ruta: '/terminosdeuso',
})

export default function TerminosDeUsoPage() {
  return (
    <FondoDegradado>
      <NavbarSpacer />
      <EncabezadoPagina titulo="AVISO LEGAL Y TÉRMINOS DE USO" />
      <div className="container mx-auto max-w-4xl p-6 pt-12 pb-24">
        <TextoLegal bloques={terminosDeUso} />
      </div>
    </FondoDegradado>
  )
}
