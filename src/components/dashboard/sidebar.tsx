'use client'

import {
  Activity,
  Briefcase,
  CircleUserRound,
  FileText,
  Inbox,
  LogOut,
  Menu,
  Newspaper,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cerrarSesion } from '@/lib/actions/auth'
import type { SeccionPanel } from '@/lib/rbac'
import { cn } from '@/lib/utils'

const ICONOS: Record<string, LucideIcon> = {
  '/dashboard/perfil': CircleUserRound,
  '/dashboard/usuarios': Users,
  '/dashboard/clientes': Users,
  '/dashboard/servicios': Briefcase,
  '/dashboard/recursos': FileText,
  '/dashboard/mensajes': Inbox,
  '/dashboard/automatizacion': Zap,
  '/dashboard/noticias': Newspaper,
  '/dashboard/estado': Activity,
}

export type DatosSidebar = {
  nombre: string
  email: string
  imagen: string | null
  esCliente: boolean
  secciones: Pick<SeccionPanel, 'href' | 'titulo'>[]
  noLeidos: number
}

function ContenidoSidebar({ datos, alNavegar }: { datos: DatosSidebar; alNavegar?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src={datos.imagen || '/isotipouno.png'}
          alt=""
          width={88}
          height={88}
          className="mb-2 size-22 rounded-full bg-white object-cover"
        />
        <p className="text-base font-bold break-words">{datos.nombre.toUpperCase()}</p>
        <p className="text-xs break-all opacity-90">{datos.email}</p>
      </div>
      <nav aria-label="Panel" className="flex-1">
        <ul className="space-y-1">
          {datos.secciones.map((s) => {
            const Icono = ICONOS[s.href] ?? FileText
            const activo = pathname === s.href || pathname.startsWith(`${s.href}/`)
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  onClick={alNavegar}
                  aria-current={activo ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded px-4 py-2 transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                    activo && 'bg-sidebar-accent font-semibold',
                  )}
                >
                  <Icono className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{s.titulo}</span>
                  {s.href === '/dashboard/mensajes' && datos.noLeidos > 0 && (
                    <span className="rounded-full bg-brand-amber px-2 text-xs font-bold text-brand-blue">
                      {datos.noLeidos}
                      <span className="sr-only"> sin leer</span>
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <form action={cerrarSesion} className="mt-4 border-t border-sidebar-border pt-4">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded px-4 py-2 text-left hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        >
          <LogOut className={cn('size-4', datos.esCliente ? 'text-red-600' : 'text-red-300')} />
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}

/**
 * Sidebar del panel: azul para ADMIN/TEAM y verde para CLIENT (como el sitio anterior). En
 * pantallas chicas se abre como panel lateral desde el botón de menú.
 */
export function Sidebar({ datos }: { datos: DatosSidebar }) {
  const [abierto, setAbierto] = useState(false)
  const tema = cn('bg-sidebar text-sidebar-foreground', datos.esCliente && 'sidebar-client')

  return (
    <>
      <aside className={cn(tema, 'hidden w-64 shrink-0 md:block')}>
        <div className="sticky top-28">
          <ContenidoSidebar datos={datos} />
        </div>
      </aside>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              tema,
              'fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg md:hidden',
            )}
          >
            <Menu className="size-5" aria-hidden="true" />
            Menú del panel
          </button>
        </SheetTrigger>
        <SheetContent side="left" className={cn(tema, 'w-72 border-none p-0')}>
          <SheetTitle className="sr-only">Menú del panel</SheetTitle>
          <ContenidoSidebar datos={datos} alNavegar={() => setAbierto(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
