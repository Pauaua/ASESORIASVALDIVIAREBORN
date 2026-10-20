import type { Metadata } from 'next'
import Link from 'next/link'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { Footer } from '@/components/site/footer'
import { Navbar } from '@/components/site/navbar'

export const metadata: Metadata = {
  title: '404 — Página no encontrada',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="contenido" tabIndex={-1} className="outline-none">
        <FondoDegradado className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-7xl font-bold text-brand-blue">404</h1>
          <p className="mb-2 text-2xl font-semibold text-brand-blue">Página no encontrada</p>
          <p className="mb-8 text-gray-700">La página que buscas no existe o fue movida.</p>
          <Link
            href="/"
            className="rounded-lg bg-brand-blue px-6 py-3 text-white transition-colors hover:bg-brand-green hover:text-brand-blue"
          >
            Volver al inicio
          </Link>
        </FondoDegradado>
      </main>
      <Footer />
    </>
  )
}
