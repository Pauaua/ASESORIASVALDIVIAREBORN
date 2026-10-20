import Image from 'next/image'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Contenedor con el fondo degradado de la marca (`fondodegradado.png`), igual que el
 * `background-size: cover` del sitio anterior pero servido optimizado (AVIF/WebP) por next/image.
 */
export function FondoDegradado({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('relative isolate', className)} {...props}>
      <Image src="/fondodegradado.png" alt="" fill sizes="100vw" className="-z-10 object-cover" />
      {children}
    </div>
  )
}
