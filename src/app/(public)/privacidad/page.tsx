import { EncabezadoPagina } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { NavbarSpacer } from '@/components/site/navbar'
import { TextoLegal } from '@/components/site/texto-legal'
import { privacidad } from '@/content/legal/privacidad'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Política de Privacidad',
  descripcion:
    'Política de privacidad de Asesorías Valdivia: cómo se recogen, usan y protegen los datos personales.',
  ruta: '/privacidad',
})

export default function PrivacidadPage() {
  return (
    <FondoDegradado>
      <NavbarSpacer />
      <EncabezadoPagina titulo="PRIVACIDAD" className="py-10" />
      <div className="container mx-auto max-w-4xl p-6 pb-16">
        <TextoLegal bloques={privacidad} />
      </div>
    </FondoDegradado>
  )
}
