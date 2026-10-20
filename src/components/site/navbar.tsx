import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { getUsuario } from '@/lib/session'
import { NavbarMenu, NavbarMenuEstatico } from './navbar-menu'

/** Menú con la sesión del usuario: lee cookies, así que se transmite tras el shell estático. */
async function NavbarMenuConSesion() {
  const usuario = await getUsuario()
  return <NavbarMenu rol={usuario?.rol ?? null} />
}

/** Barra de navegación fija, azul semitransparente, con el logo a la izquierda. */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-brand-blue/65 px-4 py-3 text-white sm:px-6 lg:px-8">
      <nav aria-label="Principal" className="mx-auto flex flex-wrap items-center justify-between">
        <Link href="/" className="shrink-0 rounded focus-visible:ring-2 focus-visible:ring-white">
          <Image
            src="/logouno.png"
            alt="Asesorías Valdivia — ir al inicio"
            width={2185}
            height={808}
            sizes="(min-width: 1024px) 192px, (min-width: 640px) 144px, 112px"
            preload
            className="h-auto w-28 sm:w-36 lg:w-48"
          />
        </Link>
        <Suspense fallback={<NavbarMenuEstatico />}>
          <NavbarMenuConSesion />
        </Suspense>
      </nav>
    </header>
  )
}

/** Separador azul bajo la navbar fija, para páginas cuyo contenido empieza arriba. */
export function NavbarSpacer() {
  return <div aria-hidden="true" className="bg-brand-blue py-14" />
}
