import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Navbar, NavbarSpacer } from '@/components/site/navbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { db } from '@/lib/db'
import { contarNoLeidos } from '@/lib/data/mensajes'
import { can, seccionesPara } from '@/lib/rbac'
import { getUsuario } from '@/lib/session'

export const metadata: Metadata = {
  title: { template: '%s | Panel — Asesorías Valdivia', default: 'Panel de usuario' },
  robots: { index: false, follow: false },
}

/** Sidebar con los datos frescos del usuario (se actualiza al editar el perfil). */
async function SidebarPanel() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/auth/login')

  const [datos, noLeidos] = await Promise.all([
    db.user.findUnique({
      where: { id: usuario.id },
      select: { name: true, lastname: true, email: true, image: true },
    }),
    can(usuario.rol, 'mensajes.ver')
      ? contarNoLeidos().then((n) => n.contacto + n.cotizacion + n.solicitud)
      : Promise.resolve(0),
  ])
  if (!datos) redirect('/auth/login')

  return (
    <Sidebar
      datos={{
        nombre: `${datos.name} ${datos.lastname}`.trim(),
        email: datos.email,
        imagen: datos.image,
        esCliente: usuario.rol === 'CLIENT',
        secciones: seccionesPara(usuario.rol).map(({ href, titulo }) => ({ href, titulo })),
        noLeidos,
      }}
    />
  )
}

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="flex min-h-[calc(100vh-7rem)] bg-gray-100">
        <Suspense fallback={<div className="hidden w-64 shrink-0 bg-sidebar md:block" />}>
          <SidebarPanel />
        </Suspense>
        <main
          id="contenido"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 pb-24 outline-none md:p-10"
        >
          <TooltipProvider>{children}</TooltipProvider>
        </main>
      </div>
    </>
  )
}
