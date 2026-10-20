import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Toaster } from '@/components/ui/sonner'
import { sitio } from '@/content/sitio'
import { env } from '@/env'
import { jsonLd } from '@/lib/seo'
import { cn } from '@/lib/utils'
import './globals.css'

const overusedGrotesk = localFont({
  src: './fonts/OverusedGrotesk-VF.woff',
  variable: '--font-overused-grotesk',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: sitio.nombre,
    template: `%s | ${sitio.nombre}`,
  },
  description: sitio.descripcion,
  keywords: [
    'asesoría contable',
    'asesoría tributaria',
    'asesoría laboral',
    'auditorías',
    'contador',
    'Antofagasta',
    'Chile',
  ],
  applicationName: sitio.nombre,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: '/',
    siteName: sitio.nombre,
    title: sitio.nombre,
    description:
      'Servicios de Asesoría Contable, Laboral, Tributaria y Auditorías en Antofagasta, Chile.',
  },
  twitter: {
    card: 'summary_large_image',
    title: sitio.nombre,
    description:
      'Servicios de Asesoría Contable, Laboral, Tributaria y Auditorías en Antofagasta, Chile.',
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#2B55A0',
}

/** Datos estructurados de la empresa (schema.org AccountingService ⊂ LocalBusiness). */
const organizacion = {
  '@context': 'https://schema.org',
  '@type': 'AccountingService',
  '@id': `${sitio.url}/#organizacion`,
  name: sitio.nombre,
  legalName: sitio.razonSocial,
  description: sitio.descripcion,
  url: sitio.url,
  logo: `${sitio.url}/logouno.png`,
  image: `${sitio.url}/opengraph-image`,
  email: sitio.email,
  telephone: sitio.telefono,
  address: {
    '@type': 'PostalAddress',
    streetAddress: sitio.direccion.calle,
    addressLocality: sitio.direccion.ciudad,
    addressRegion: sitio.direccion.region,
    addressCountry: sitio.direccion.pais,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: sitio.direccion.lat,
    longitude: sitio.direccion.lng,
  },
  areaServed: { '@type': 'Country', name: 'Chile' },
  sameAs: [sitio.redes.facebook, sitio.redes.instagram],
  knowsAbout: ['Contabilidad', 'Asesoría tributaria', 'Asesoría laboral', 'Auditoría'],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-CL" className={cn('font-sans', overusedGrotesk.variable)}>
      <body>
        <a
          href="#contenido"
          className="sr-only z-[60] focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-brand-blue focus:shadow"
        >
          Saltar al contenido
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizacion)} />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
