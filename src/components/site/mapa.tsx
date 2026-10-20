'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Mapa de Google embebido que se carga recién cuando el footer está por entrar en pantalla
 * (`loading="lazy"` en móviles lo descarga casi de inmediato: son ~300 KB de JS de terceros).
 */
export function MapaDiferido({ src, titulo }: { src: string; titulo: string }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={contenedor} className="h-40 w-full bg-white/10 sm:h-52">
      {visible && (
        <iframe
          src={src}
          title={titulo}
          className="h-full w-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
    </div>
  )
}
