import { Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto de una sección del panel mientras llegan los datos. */
export function CargandoPanel() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md" aria-busy="true">
      <span className="sr-only" role="status">
        Cargando…
      </span>
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </div>
  )
}

/**
 * Envuelve una página del panel en <Suspense>: la navegación muestra el esqueleto al instante y
 * el contenido (que lee la sesión y la BD) se transmite después.
 */
export function enSuspense<P extends object>(Contenido: (props: P) => Promise<ReactNode>) {
  return function PaginaPanel(props: P) {
    return (
      <Suspense fallback={<CargandoPanel />}>
        <Contenido {...props} />
      </Suspense>
    )
  }
}
