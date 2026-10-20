'use client'

import Link from 'next/link'
import { FondoDegradado } from '@/components/site/fondo-degradado'

export default function ErrorPublico({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <FondoDegradado className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-5xl font-bold text-brand-blue">¡Algo salió mal!</h1>
      <p className="mb-8 text-gray-700">
        Ha ocurrido un error inesperado. Por favor intenta nuevamente.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-brand-blue px-6 py-3 text-white transition-colors hover:bg-brand-green hover:text-brand-blue"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-lg border border-brand-blue bg-white px-6 py-3 text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </FondoDegradado>
  )
}
