'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          language?: string
          callback: (token: string) => void
          'expired-callback'?: () => void
        },
      ) => string
      remove: (id: string) => void
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/**
 * Widget de Cloudflare Turnstile. Solo se renderiza si NEXT_PUBLIC_TURNSTILE_SITE_KEY está
 * configurada; si no, no hace nada (el servidor tampoco lo exige).
 */
export function Turnstile({ onToken }: { onToken: (token: string | undefined) => void }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    if (!SITE_KEY || !cargado || !contenedor.current || !window.turnstile) return
    const id = window.turnstile.render(contenedor.current, {
      sitekey: SITE_KEY,
      language: 'es',
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(undefined),
    })
    return () => window.turnstile?.remove(id)
  }, [cargado, onToken])

  if (!SITE_KEY) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setCargado(true)}
      />
      <div ref={contenedor} />
    </>
  )
}
