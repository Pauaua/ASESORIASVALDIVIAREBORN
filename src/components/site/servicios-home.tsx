import Image from 'next/image'
import Link from 'next/link'
import { servicios } from '@/content/servicios'
import { BotonCotizaAqui } from './boton-cotiza'

/** Sección "NUESTROS SERVICIOS" del home: 4 tarjetas que llevan a /servicios. */
export function ServiciosHome() {
  return (
    <section aria-labelledby="titulo-servicios" className="p-4 text-brand-blue">
      <div className="mt-10 flex flex-col items-center justify-between p-4 md:flex-row">
        <Image
          src="/icononuestrosservicios.png"
          alt=""
          width={165}
          height={200}
          className="mb-4 shrink-0 md:mb-0"
        />
        <div className="flex flex-col text-center md:ml-4 md:text-right">
          <h2
            id="titulo-servicios"
            className="text-3xl tracking-[0.1rem] sm:text-4xl md:text-6xl lg:text-8xl"
          >
            NUESTROS SERVICIOS
          </h2>
          <p className="mt-4 text-sm sm:text-base md:text-xl lg:text-2xl">
            Estos son todos los servicios que tenemos disponibles para ti
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {servicios.map((servicio) => (
          <li key={servicio.id}>
            <Link
              href="/servicios"
              className="flex flex-col items-center rounded-2xl bg-brand-white py-4 shadow-md transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand-blue motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <div className="relative mb-3 h-60 w-full">
                <Image
                  src={servicio.imagen.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="rounded-xl object-cover"
                />
              </div>
              <h3 className="w-full px-4 text-left text-2xl font-bold text-brand-blue">
                {servicio.titulo}
              </h3>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 ml-4 flex items-center space-x-3 sm:mt-10 sm:ml-8 sm:space-x-5">
        <BotonCotizaAqui />
        <Image
          src="/flechaazulizquierda.png"
          alt=""
          width={115}
          height={140}
          className="h-auto w-12 sm:w-16 md:w-24 lg:w-28"
        />
      </div>
    </section>
  )
}
