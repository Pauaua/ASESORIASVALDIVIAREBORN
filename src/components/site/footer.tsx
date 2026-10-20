import { Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { FacebookIcon, InstagramIcon } from '@/components/icons/brands'
import { sitio } from '@/content/sitio'
import { FondoDegradado } from './fondo-degradado'

const enlaceCls = 'text-sm hover:text-brand-white sm:text-base lg:text-lg'
const tituloCls = 'mb-4 text-xl font-semibold md:text-2xl lg:text-3xl'

export function Footer() {
  return (
    <FondoDegradado className="text-brand-blue">
      <footer className="container mx-auto px-4 py-8">
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex w-full justify-center md:hidden">
            <Image src="/isotipouno.png" alt="" width={100} height={100} />
          </div>

          <section aria-labelledby="footer-contacto">
            <h2 id="footer-contacto" className={tituloCls}>
              CONTACTO
            </h2>
            <ul className="space-y-2">
              <li>
                <a href={`mailto:${sitio.email}`} className={enlaceCls}>
                  {sitio.email}
                </a>
              </li>
              <li>
                <Link href="/cotiza" className={enlaceCls}>
                  Cotiza con nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className={enlaceCls}>
                  Consultas generales
                </Link>
              </li>
            </ul>
            <div className="my-8">
              <iframe
                src={sitio.mapaEmbed}
                title="Mapa: oficina de Asesorías Valdivia en Arturo Prat 482, Antofagasta"
                className="h-40 w-full border-0 sm:h-52"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <address className="mt-8 text-left text-sm not-italic md:text-base">
              {sitio.direccion.lineas.map((linea) => (
                <span key={linea} className="block">
                  {linea}
                </span>
              ))}
            </address>
          </section>

          <section aria-labelledby="footer-informacion">
            <h2 id="footer-informacion" className={tituloCls}>
              INFORMACIÓN
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/nosotros" className={enlaceCls}>
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/misionvision" className={enlaceCls}>
                  Misión y Visión
                </Link>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-politicas">
            <h2 id="footer-politicas" className={tituloCls}>
              POLÍTICAS
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidad" className={enlaceCls}>
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminosdeuso" className={enlaceCls}>
                  Aviso legal y Términos de Uso
                </Link>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-rrss">
            <h2 id="footer-rrss" className={tituloCls}>
              RRSS
            </h2>
            <ul className="flex space-x-4">
              <li>
                <a
                  href={`mailto:${sitio.email}`}
                  aria-label="Escríbenos un correo"
                  className="hover:text-red-600"
                >
                  <Mail className="size-6" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={sitio.redes.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook de Asesorías Valdivia (se abre en una pestaña nueva)"
                  className="hover:text-blue-700"
                >
                  <FacebookIcon size={24} />
                </a>
              </li>
              <li>
                <a
                  href={sitio.redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Asesorías Valdivia (se abre en una pestaña nueva)"
                  className="hover:text-pink-500"
                >
                  <InstagramIcon size={24} />
                </a>
              </li>
            </ul>
          </section>

          <div className="absolute right-0 bottom-0 hidden lg:block">
            <Image src="/isotipodos.png" alt="" width={200} height={200} />
          </div>
          <div className="flex w-full justify-center md:hidden">
            <Image src="/isotipodos.png" alt="" width={100} height={100} />
          </div>
        </div>
      </footer>
    </FondoDegradado>
  )
}
