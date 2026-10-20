'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

type Props = {
  palabras: readonly string[]
  velocidadEscritura?: number
  velocidadBorrado?: number
  pausa?: number
}

/**
 * Efecto máquina de escribir con cursor ámbar. Los lectores de pantalla leen las palabras
 * completas (texto oculto) en vez de cada letra; con "reducir movimiento" muestra las palabras
 * sin animación.
 */
export function Typewriter({
  palabras,
  velocidadEscritura = 30,
  velocidadBorrado = 10,
  pausa = 2000,
}: Props) {
  const [indice, setIndice] = useState(0)
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)
  const estatico = useReducedMotion()

  useEffect(() => {
    if (estatico) return
    const palabra = palabras[indice % palabras.length] ?? ''
    let espera = borrando ? velocidadBorrado : velocidadEscritura
    if (!borrando && texto === palabra) espera = pausa

    const timer = setTimeout(() => {
      if (!borrando && texto === palabra) setBorrando(true)
      else if (borrando && texto === '') {
        setBorrando(false)
        setIndice((i) => i + 1)
      } else {
        setTexto(palabra.slice(0, texto.length + (borrando ? -1 : 1)))
      }
    }, espera)
    return () => clearTimeout(timer)
  }, [texto, borrando, indice, estatico, palabras, velocidadEscritura, velocidadBorrado, pausa])

  if (estatico) return <span>{palabras.join(' · ')}</span>

  return (
    <>
      <span className="sr-only">{palabras.join(', ')}</span>
      <span aria-hidden="true">
        {texto}
        <span className="ml-0.5 animate-pulse text-brand-amber">|</span>
      </span>
    </>
  )
}
