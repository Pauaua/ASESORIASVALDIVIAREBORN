import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Typewriter } from './typewriter'

/** Banner estático "ASESORÍAS VALDIVIA" (home y /servicios). */
export function BannerEstatico() {
  return (
    <section aria-label="Asesorías Valdivia" className="relative isolate">
      <Image src="/bannercierredos.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover" />
      <div className="flex h-40 flex-col items-center justify-center px-4 sm:h-56 md:h-80 lg:h-96">
        <p className="rounded-full border-2 px-3 py-2 text-center text-lg font-bold tracking-[0.2rem] text-brand-white uppercase sm:px-6 sm:text-3xl md:px-10 md:py-4 md:text-5xl lg:px-14 lg:py-8 lg:text-8xl">
          ASESORÍAS VALDIVIA
        </p>
      </div>
    </section>
  )
}

/** Banner de cierre con efecto máquina de escribir (ASESÓRATE / FÓRMATE / CRECE). */
export function BannerCierre() {
  return (
    <section aria-label="Asesórate, fórmate, crece" className="relative isolate">
      <Image src="/bannerextrados.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover" />
      <div className="flex h-40 flex-col items-center justify-center px-4 sm:h-56 md:h-80 lg:h-96">
        <p className="rounded-full border-2 border-brand-white px-4 py-1 text-center text-lg tracking-[0.2rem] text-brand-white uppercase sm:px-8 sm:py-2 sm:text-2xl md:border-4 md:px-14 md:text-5xl lg:px-20 lg:text-7xl">
          ASESORÍAS VALDIVIA
        </p>
        <p className="mt-2 text-xs font-semibold text-brand-white sm:text-sm md:text-2xl lg:text-3xl">
          <Typewriter palabras={['ASESÓRATE', 'FÓRMATE', 'CRECE']} />
        </p>
      </div>
    </section>
  )
}

/** Banner "¿YA ERES CLIENTE?" de /contacto. */
export function BannerClientes() {
  return (
    <section
      aria-labelledby="titulo-ya-eres-cliente"
      className="relative h-[200px] w-full overflow-hidden sm:h-[300px] md:h-[400px] lg:h-[500px]"
    >
      <Image src="/bannerclientescontacto.jpg" alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-4 backdrop-blur-sm sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <h2
            id="titulo-ya-eres-cliente"
            className="text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl"
          >
            ¿YA ERES CLIENTE?
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Link
              href="/solicitude"
              className="rounded-full bg-brand-blue px-4 py-2 text-center text-sm text-brand-white transition-colors hover:bg-brand-white hover:text-brand-blue focus-visible:ring-4 focus-visible:ring-brand-green sm:text-base"
            >
              Solicita tu usuario
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full bg-brand-white px-4 py-2 text-center text-sm text-brand-blue transition-colors hover:bg-brand-blue hover:text-brand-white focus-visible:ring-4 focus-visible:ring-brand-green sm:text-base"
            >
              Accede al panel de usuario
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Banner con imagen de fondo y franja azul semitransparente, usado en /contacto, /cotiza y
 * /solicitude. `titulo` es el h1 de la página.
 */
export function BannerFormulario({
  titulo,
  subtitulo,
  icono = false,
  className,
  tituloClassName,
}: {
  titulo: ReactNode
  subtitulo: ReactNode
  icono?: boolean
  className?: string
  tituloClassName?: string
}) {
  return (
    <section className={cn('relative isolate text-white', className)}>
      <Image
        src="/bannerescribennos.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="relative pt-20 sm:pt-32 md:pt-56 lg:pt-80">
        <div className="bg-brand-blue/50 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
          <h1 className={cn('tracking-[0.3rem]', tituloClassName)}>
            <span className="block">{titulo}</span>
            <span className="flex items-center gap-3 py-3 text-base text-brand-white italic sm:gap-4 sm:py-4 sm:text-xl md:text-4xl lg:text-6xl">
              {subtitulo}
              {icono && (
                <Image
                  src="/iconoescribenos.png"
                  alt=""
                  width={96}
                  height={89}
                  className="size-8 sm:size-12 md:size-20 lg:size-24"
                />
              )}
            </span>
          </h1>
        </div>
      </div>
    </section>
  )
}

/** Encabezado azul de páginas de texto (/misionvision, /privacidad, /terminosdeuso, …). */
export function EncabezadoPagina({ titulo, className }: { titulo: string; className?: string }) {
  return (
    <header className={cn('bg-brand-blue py-8 text-center text-white', className)}>
      <h1 className="px-4 text-3xl font-bold sm:text-4xl">{titulo}</h1>
    </header>
  )
}
