import type { Metadata } from 'next'
import Link from 'next/link'
import { FondoDegradado } from '@/components/site/fondo-degradado'

export const metadata: Metadata = {
  title: 'Acceso no autorizado',
  robots: { index: false, follow: false },
}

export default function UnauthorizedPage() {
  return (
    <FondoDegradado className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="mb-4 text-4xl font-bold text-red-700">Acceso no autorizado</h1>
        <p className="text-xl text-gray-700">No tienes permisos para ver esta página.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-3 text-white transition-colors hover:bg-brand-green hover:text-brand-blue"
        >
          Volver al inicio
        </Link>
      </div>
    </FondoDegradado>
  )
}
