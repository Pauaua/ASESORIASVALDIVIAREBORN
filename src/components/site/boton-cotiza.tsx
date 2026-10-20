import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Botón píldora azul "Cotiza aquí" → /cotiza. */
export function BotonCotizaAqui({ className }: { className?: string }) {
  return (
    <Link
      href="/cotiza"
      className={cn(
        'inline-block rounded-full bg-brand-blue px-3 py-2 text-sm tracking-[0.1rem] text-white shadow-lg transition duration-300 hover:bg-brand-white hover:text-brand-blue focus-visible:ring-4 focus-visible:ring-brand-green sm:text-base md:text-xl',
        className,
      )}
    >
      Cotiza aquí
    </Link>
  )
}
