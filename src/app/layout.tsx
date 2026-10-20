import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { cn } from '@/lib/utils'
import './globals.css'

const overusedGrotesk = localFont({
  src: './fonts/OverusedGrotesk-VF.woff',
  variable: '--font-overused-grotesk',
  weight: '100 900',
  display: 'swap',
})

// La metadata completa (plantilla de título, Open Graph, etc.) se define en la fase 2.
export const metadata: Metadata = {
  title: 'Asesorías Valdivia',
  description:
    'Asesorías Valdivia — Servicios de Asesoría Contable, Laboral, Tributaria y Auditorías en Antofagasta, Chile.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-CL" className={cn('font-sans', overusedGrotesk.variable)}>
      <body>{children}</body>
    </html>
  )
}
