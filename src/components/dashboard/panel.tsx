import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Tarjeta blanca con el título de la sección en mayúsculas, como el panel anterior. */
export function Panel({
  titulo,
  acciones,
  children,
  className,
}: {
  titulo: ReactNode
  acciones?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-lg bg-white p-4 shadow-md md:p-6', className)}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-brand-blue md:text-2xl">{titulo}</h1>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
      {children}
    </section>
  )
}

/** Texto para estados vacíos de tablas y listados. */
export function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed p-6 text-center text-gray-500">{children}</p>
}

/** Paginación por enlaces que conserva los demás parámetros de búsqueda. */
export function Paginacion({
  pagina,
  paginas,
  total,
  ruta,
  params,
}: {
  pagina: number
  paginas: number
  total: number
  ruta: string
  params: Record<string, string | undefined>
}) {
  if (paginas <= 1) return <p className="mt-4 text-sm text-gray-500">{total} resultado(s)</p>
  const href = (p: number) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v)
    if (p > 1) sp.set('pagina', String(p))
    const qs = sp.toString()
    return qs ? `${ruta}?${qs}` : ruta
  }
  const enlace =
    'inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-gray-50'
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-2">
      <p className="text-sm text-gray-500">
        {total} resultado(s) · página {pagina} de {paginas}
      </p>
      <div className="flex gap-2">
        {pagina > 1 ? (
          <Link href={href(pagina - 1)} className={enlace}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
          </Link>
        ) : null}
        {pagina < paginas ? (
          <Link href={href(pagina + 1)} className={enlace}>
            Siguiente <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}

/** Lee un parámetro de búsqueda como string único. */
export function param(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}
