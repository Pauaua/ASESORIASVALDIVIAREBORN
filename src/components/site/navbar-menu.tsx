'use client'

import { CircleUserRound, LayoutDashboard, LogOut, Menu, UserPlus, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cerrarSesion } from '@/lib/actions/auth'
import type { Rol } from '@/lib/rbac'
import { cn } from '@/lib/utils'

type Enlace = { href: string; texto: string }

const ENLACES_PUBLICOS: Enlace[] = [
  { href: '/nosotros', texto: '¿Quiénes somos?' },
  { href: '/servicios', texto: 'Servicios' },
  { href: '/noticias', texto: 'Noticias' },
  { href: '/contacto', texto: 'Contacto' },
]

const enlaceCls =
  'flex items-center rounded px-4 py-1 transition-colors duration-200 hover:bg-brand-white hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-white'

/** Enlaces según el rol: sin sesión y CLIENT ven el sitio; ADMIN y TEAM, accesos de trabajo. */
function enlacesPara(rol: Rol | null): Enlace[] {
  if (rol === 'ADMIN' || rol === 'TEAM') return [{ href: '/', texto: 'Página de Inicio' }]
  return ENLACES_PUBLICOS
}

/**
 * Menú de la navbar: horizontal desde `lg`, desplegable (hamburguesa) en pantallas menores.
 * Sin sesión: enlaces del sitio + acceso al login. Con sesión: Panel de Usuario, (ADMIN)
 * Registrar nuevo usuario y Cerrar sesión.
 */
export function NavbarMenu({ rol = null }: { rol?: Rol | null }) {
  const [abierto, setAbierto] = useState(false)
  const pathname = usePathname()

  // Cierra el menú al navegar (ajuste de estado durante el render, sin efecto) o con Escape.
  const [rutaAnterior, setRutaAnterior] = useState(pathname)
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname)
    setAbierto(false)
  }
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto])

  return (
    <>
      <button
        type="button"
        className="rounded p-1 focus-visible:ring-2 focus-visible:ring-white lg:hidden"
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={abierto}
        aria-controls="menu-principal"
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      <ul
        id="menu-principal"
        className={cn(
          'mt-4 w-full flex-col gap-2 lg:mt-0 lg:flex lg:w-auto lg:flex-row lg:items-center lg:justify-end lg:gap-6',
          abierto ? 'flex' : 'hidden',
        )}
      >
        {enlacesPara(rol).map((enlace) => {
          const activo =
            enlace.href === '/'
              ? pathname === '/'
              : pathname === enlace.href || pathname.startsWith(`${enlace.href}/`)
          return (
            <li key={enlace.href} className="w-full lg:w-auto">
              <Link
                href={enlace.href}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  enlaceCls,
                  'aria-[current=page]:underline aria-[current=page]:underline-offset-4',
                )}
              >
                <Image
                  src="/flechaazulderecha.png"
                  alt=""
                  width={21}
                  height={25}
                  className="mr-2"
                />
                <span>{enlace.texto}</span>
              </Link>
            </li>
          )
        })}
        {rol ? (
          <>
            <li className="w-full lg:w-auto">
              <Link href="/dashboard" className={enlaceCls}>
                <LayoutDashboard className="mr-2 size-5" aria-hidden="true" />
                Panel de Usuario
              </Link>
            </li>
            {rol === 'ADMIN' && (
              <li className="w-full lg:w-auto">
                <Link href="/dashboard/usuarios/nuevo" className={enlaceCls}>
                  <UserPlus className="mr-2 size-5" aria-hidden="true" />
                  Registrar nuevo usuario
                </Link>
              </li>
            )}
            <li className="w-full lg:w-auto">
              <form action={cerrarSesion}>
                <button type="submit" className={cn(enlaceCls, 'w-full')}>
                  <LogOut className="mr-2 size-5" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </form>
            </li>
          </>
        ) : (
          <li className="w-full lg:w-auto">
            <Link
              href="/auth/login"
              aria-label="Iniciar sesión"
              className="flex items-center rounded px-3 py-2 transition-colors duration-200 hover:bg-brand-white hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-white"
            >
              <CircleUserRound className="size-5" aria-hidden="true" />
              <span className="ml-2 lg:sr-only">Iniciar sesión</span>
            </Link>
          </li>
        )}
      </ul>
    </>
  )
}
