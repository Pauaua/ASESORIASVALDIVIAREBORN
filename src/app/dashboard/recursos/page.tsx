import { enSuspense } from '@/components/dashboard/carga'
import { Panel } from '@/components/dashboard/panel'
import { AdministradorRecursos, VistaRecursos } from '@/components/dashboard/recursos'
import { db } from '@/lib/db'
import { listarCategorias } from '@/lib/data/recursos'
import { can } from '@/lib/rbac'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Recursos' }

async function RecursosPage() {
  const yo = await requirePagina('recursos.ver')
  const categorias = await listarCategorias()

  if (can(yo.rol, 'recursos.administrar')) {
    return (
      <Panel titulo="ADMINISTRADOR DE RECURSOS">
        <AdministradorRecursos categorias={categorias} />
      </Panel>
    )
  }

  // CLIENT ve además su "Biblioteca digital" (link a su carpeta de Drive).
  const driveURL =
    yo.rol === 'CLIENT'
      ? ((await db.user.findUnique({ where: { id: yo.id }, select: { driveURL: true } }))
          ?.driveURL ?? null)
      : undefined

  return (
    <Panel titulo="RECURSOS COMPLEMENTARIOS">
      <p className="mb-6">Haz click en cada recurso para acceder a él.</p>
      <VistaRecursos categorias={categorias} driveURL={driveURL} />
    </Panel>
  )
}

export default enSuspense(RecursosPage)
