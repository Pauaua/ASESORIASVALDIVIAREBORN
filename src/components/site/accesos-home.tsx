import Image from 'next/image'
import Link from 'next/link'

const enlaceCls =
  'group flex items-center rounded-full border-2 border-transparent bg-transparent px-8 shadow-lg transition-all duration-300 hover:border-brand-blue hover:shadow-xl focus-visible:border-brand-blue focus-visible:outline-none'

/** Bloque de 3 accesos del home: BLOG, ASESORÍAS y COTIZA NUESTROS SERVICIOS. */
export function AccesosHome() {
  return (
    <section aria-label="Accesos rápidos" className="p-4 sm:p-8 xl:p-20">
      <div className="flex flex-col items-center justify-between text-brand-blue md:flex-row">
        <div className="flex flex-col md:space-y-12">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-12">
            <Link href="/noticias" className={`${enlaceCls} py-2`}>
              <Image src="/iconoblog.png" width={124} height={150} alt="" />
              <span className="ml-4 hidden xs:block">
                <span className="block text-xl font-bold sm:text-2xl sm:font-normal md:text-4xl">
                  BLOG
                </span>
                <span className="block text-xs md:text-base">
                  Datos y noticias para impulsar tu <br /> negocio y marca personal
                </span>
              </span>
              <span className="sr-only xs:hidden">Blog</span>
            </Link>
            <Link href="/servicios" className={`${enlaceCls} py-2`}>
              <Image src="/iconoasesorias.png" width={124} height={150} alt="" />
              <span className="ml-4 hidden xs:block">
                <span className="block text-xl font-bold sm:text-2xl sm:font-normal md:text-4xl">
                  ASESORÍAS
                </span>
                <span className="block text-xs md:text-base">personalizadas y confidenciales</span>
              </span>
              <span className="sr-only xs:hidden">Asesorías</span>
            </Link>
          </div>
          <Link href="/cotiza" className={`${enlaceCls} mt-4 py-4 md:mt-0`}>
            <Image src="/iconoescribenos.png" width={150} height={139} alt="" />
            <span className="ml-4 hidden xs:block">
              <span className="block text-xl font-bold sm:text-2xl sm:font-normal md:text-4xl">
                COTIZA NUESTROS <br /> SERVICIOS
              </span>
              <span className="block text-xs md:text-base">
                Asesorías Valdivia cuenta con una serie de servicios que pueden ayudarte a llevar tu
                negocio al éxito
              </span>
            </span>
            <span className="sr-only xs:hidden">Cotiza nuestros servicios</span>
          </Link>
          <div className="mt-4 block xl:hidden">
            <Image
              src="/flechagranderesponsiva.png"
              width={300}
              height={325}
              alt=""
              className="h-auto"
            />
          </div>
        </div>
        <div className="hidden shrink-0 xl:block">
          <Image src="/iconoflechagrande.png" width={400} height={369} alt="" />
        </div>
      </div>
    </section>
  )
}
