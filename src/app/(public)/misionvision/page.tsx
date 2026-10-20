import { EncabezadoPagina } from '@/components/site/banners'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { NavbarSpacer } from '@/components/site/navbar'
import { metadataPagina } from '@/lib/seo'

export const metadata = metadataPagina({
  titulo: 'Misión y Visión',
  descripcion:
    'Conoce la misión y visión de Asesorías Valdivia: proporcionar servicios contables y financieros de alta calidad en Chile.',
  ruta: '/misionvision',
})

export default function MisionVisionPage() {
  return (
    <FondoDegradado>
      <NavbarSpacer />
      <EncabezadoPagina titulo="MISIÓN Y VISIÓN" />
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-brand-blue">MISIÓN:</h2>
            <p className="mb-4 text-lg text-gray-700">
              Proporcionar servicios contables y financieros de alta calidad a nuestros clientes,
              ayudándoles a cumplir con sus obligaciones fiscales y financieras de manera eficiente
              y efectiva.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-bold text-brand-blue">VISIÓN:</h2>
            <p className="mb-4 text-lg text-gray-700">
              Ser la empresa líder en servicios contables y financieros en Chile, reconocida por su
              excelencia en el servicio al cliente y su compromiso con la calidad.
            </p>
          </section>
        </div>
      </div>
    </FondoDegradado>
  )
}
