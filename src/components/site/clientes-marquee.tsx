import Image from 'next/image'
import { ALT_CLIENTE_GENERICO, clientes } from '@/content/clientes'

/**
 * Carrusel "NUESTROS CLIENTES": cinta continua en CSS (sin JavaScript). Se pausa al pasar el
 * mouse o enfocar, y con "reducir movimiento" se convierte en una fila con scroll horizontal.
 * La lista se duplica para el bucle; la copia queda oculta para lectores de pantalla.
 */
export function ClientesMarquee() {
  return (
    <section aria-labelledby="titulo-clientes" className="w-full px-4 py-8 select-none md:py-16">
      <h2
        id="titulo-clientes"
        className="mb-4 py-4 text-left text-4xl tracking-[0.1rem] text-brand-blue sm:text-5xl md:mb-8 md:py-8 md:text-6xl lg:text-8xl"
      >
        NUESTROS CLIENTES
      </h2>

      <div className="group my-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] py-5 motion-reduce:overflow-x-auto md:my-8 md:py-10">
        <div className="flex w-max animate-[marquee_90s_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copia) => (
            <ul
              key={copia}
              aria-hidden={copia === 1 ? true : undefined}
              aria-label={copia === 0 ? 'Logos de clientes' : undefined}
              className="flex shrink-0 items-center gap-4 pr-4 md:gap-8 md:pr-8 lg:gap-12 lg:pr-12"
            >
              {clientes.map((cliente) => (
                <li
                  key={cliente.src}
                  className="relative size-24 shrink-0 sm:size-32 md:size-40 lg:size-48"
                >
                  <Image
                    src={cliente.src}
                    alt={copia === 0 ? cliente.alt || ALT_CLIENTE_GENERICO : ''}
                    fill
                    sizes="(min-width: 1024px) 192px, (min-width: 768px) 160px, (min-width: 640px) 128px, 96px"
                    className="rounded-full object-contain"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
