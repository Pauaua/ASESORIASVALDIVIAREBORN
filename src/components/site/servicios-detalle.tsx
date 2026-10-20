import Image from 'next/image'
import { servicios } from '@/content/servicios'
import { BotonCotizaAqui } from './boton-cotiza'

/** Tarjetas de /servicios, alternadas izquierda/derecha, con botón "Cotiza aquí". */
export function ServiciosDetalle() {
  return (
    <div className="w-full">
      {servicios.map((servicio, index) => (
        <article
          key={servicio.id}
          aria-labelledby={`servicio-${servicio.id}`}
          className={`mx-3 my-4 flex flex-col overflow-hidden sm:mx-6 sm:my-8 ${
            index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
          }`}
        >
          <div className="flex w-full flex-col justify-center p-4 sm:p-6 md:p-8 lg:w-3/5">
            <Image
              src={servicio.imagen.src}
              alt=""
              width={servicio.imagen.width}
              height={servicio.imagen.height}
              sizes="100vw"
              className="mb-4 h-auto w-full object-cover lg:hidden"
            />
            <h2
              id={`servicio-${servicio.id}`}
              className="mb-3 text-xl font-semibold text-brand-blue sm:mb-6 sm:text-3xl md:mb-8 md:text-5xl lg:text-7xl"
            >
              {servicio.tituloLargo}
            </h2>
            <p className="my-3 text-sm text-brand-blue sm:my-4 sm:text-base md:my-6 md:text-lg lg:text-2xl">
              {servicio.descripcion}
            </p>
            <div className="mt-4 flex items-center space-x-3 sm:mt-8 sm:space-x-4">
              <BotonCotizaAqui className="tracking-normal sm:text-base md:text-lg" />
              <Image
                src="/flechaazulizquierda.png"
                alt=""
                width={66}
                height={80}
                className="h-auto w-10 sm:w-14 md:w-20"
              />
            </div>
          </div>
          <div className="hidden items-center justify-center p-8 lg:flex lg:w-1/3">
            <div className="relative aspect-square w-full">
              <Image
                src={servicio.imagen.src}
                alt=""
                fill
                sizes="33vw"
                className="rounded-lg object-cover"
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
