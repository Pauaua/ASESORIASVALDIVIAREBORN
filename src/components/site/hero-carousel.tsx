'use client'

import { Pause, Play } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { slidesHero } from '@/content/hero'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

const INTERVALO_MS = 5000

/**
 * Carrusel principal a pantalla completa. Rota cada 5 s; se pausa al pasar el mouse o enfocar
 * con teclado, con el botón de pausa, y no rota solo si el sistema pide reducir movimiento.
 */
export function HeroCarousel() {
  const [actual, setActual] = useState(0)
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false)
  const [enFoco, setEnFoco] = useState(false)
  const reducirMovimiento = useReducedMotion()
  const total = slidesHero.length

  const siguiente = useCallback(() => setActual((i) => (i + 1) % total), [total])
  const anterior = useCallback(() => setActual((i) => (i - 1 + total) % total), [total])

  const rotando = !pausadoPorUsuario && !enFoco && !reducirMovimiento
  useEffect(() => {
    if (!rotando) return
    const timer = setInterval(siguiente, INTERVALO_MS)
    return () => clearInterval(timer)
  }, [rotando, siguiente])

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative h-screen min-h-[560px] w-full overflow-hidden"
      onMouseEnter={() => setEnFoco(true)}
      onMouseLeave={() => setEnFoco(false)}
      onFocus={() => setEnFoco(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setEnFoco(false)
      }}
    >
      {slidesHero.map((slide, index) => {
        const visible = index === actual
        return (
          <div
            key={slide.imagen}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${total}`}
            aria-hidden={!visible}
            inert={!visible}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none',
              visible ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={slide.imagen}
              alt={slide.alt}
              fill
              sizes="100vw"
              preload={index === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 mt-20 flex flex-col justify-center px-4 pt-20 sm:px-8 md:px-16">
              {/* Solo el primer slide es el h1 de la página; los demás son decorativos. */}
              {(() => {
                const Titulo = index === 0 ? 'h1' : 'p'
                return (
                  <Titulo className="text-3xl font-bold text-white sm:text-4xl md:text-6xl lg:text-7xl">
                    <span className="mb-2 block">{slide.arriba}</span>
                    <span className="text-outline-blue mb-2 block text-brand-white">
                      {slide.medio}
                    </span>
                    <span className="mb-4 block">{slide.abajo}</span>
                  </Titulo>
                )
              })()}
              <p className="mb-6 max-w-2xl text-sm text-white sm:text-base md:text-lg lg:text-2xl">
                {slide.descripcion}
              </p>
              <div className="flex items-center">
                <Image
                  src="/flechaazulderecha.png"
                  alt=""
                  width={82}
                  height={100}
                  className="mr-2 h-auto w-8 md:w-20"
                />
                <Link
                  href={slide.cta.href}
                  className="inline-flex items-center rounded-full bg-brand-white px-3 py-2 text-sm font-semibold text-brand-blue transition-all duration-300 ease-in-out hover:bg-brand-blue hover:text-brand-white focus-visible:ring-4 focus-visible:ring-brand-green sm:px-4 sm:py-3 sm:text-base md:text-lg"
                >
                  {slide.cta.texto}
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={siguiente}
        aria-label="Siguiente diapositiva"
        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-2 focus-visible:ring-4 focus-visible:ring-brand-green"
      >
        <Image
          src="/flechaazulderecha.png"
          alt=""
          width={165}
          height={200}
          className="h-auto w-16 md:w-40"
        />
      </button>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
        <button
          type="button"
          onClick={anterior}
          className="sr-only focus:not-sr-only focus:rounded focus:bg-white focus:px-2 focus:text-brand-blue"
        >
          Diapositiva anterior
        </button>
        {slidesHero.map((slide, index) => (
          <button
            key={slide.imagen}
            type="button"
            onClick={() => setActual(index)}
            aria-label={`Ir a la diapositiva ${index + 1}`}
            aria-current={index === actual ? 'true' : undefined}
            className={cn(
              'size-3 rounded-full border-2 border-white transition-colors focus-visible:ring-2 focus-visible:ring-brand-green',
              index === actual ? 'bg-white' : 'bg-white/20',
            )}
          />
        ))}
        <button
          type="button"
          onClick={() => setPausadoPorUsuario((v) => !v)}
          aria-label={pausadoPorUsuario ? 'Reanudar carrusel' : 'Pausar carrusel'}
          className="ml-2 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          {pausadoPorUsuario ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </section>
  )
}
