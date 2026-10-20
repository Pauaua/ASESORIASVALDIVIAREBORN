import { Plus } from 'lucide-react'
import Link from 'next/link'
import { enSuspense } from '@/components/dashboard/carga'
import { Buscador } from '@/components/dashboard/formulario'
import { Paginacion, Panel, param, Vacio } from '@/components/dashboard/panel'
import { BadgeRol, SwitchEstado } from '@/components/dashboard/usuarios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listarUsuarios } from '@/lib/data/usuarios'
import { formatearFechaHora } from '@/lib/fechas'
import { ETIQUETA_ROL, isRol, ROLES } from '@/lib/rbac'
import { requirePagina } from '@/lib/session'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Usuarios' }

async function UsuariosPage({ searchParams }: PageProps<'/dashboard/usuarios'>) {
  const yo = await requirePagina('usuarios.ver')
  const sp = await searchParams
  const q = param(sp.q)?.slice(0, 100)
  const rolParam = param(sp.rol)
  const rol = isRol(rolParam) ? rolParam : undefined
  const pagina = Math.max(1, Number(param(sp.pagina)) || 1)

  const { usuarios, total, paginas } = await listarUsuarios({ q, rol, pagina })

  const filtro = (valor?: string) =>
    cn(
      'rounded-full border px-3 py-1 text-sm',
      (valor ?? '') === (rol ?? '')
        ? 'border-brand-blue bg-brand-blue text-white'
        : 'hover:bg-gray-50',
    )
  const hrefFiltro = (valor?: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (valor) p.set('rol', valor)
    const s = p.toString()
    return s ? `/dashboard/usuarios?${s}` : '/dashboard/usuarios'
  }

  return (
    <Panel
      titulo="LISTADO DE USUARIOS"
      acciones={
        <Link
          href="/dashboard/usuarios/nuevo"
          className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-4 py-2 text-sm text-white transition-colors hover:bg-brand-green hover:text-brand-blue"
        >
          <Plus className="size-4" aria-hidden="true" /> Nuevo usuario
        </Link>
      }
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Buscador placeholder="Buscar por nombre, usuario, correo o empresa" className="lg:w-96" />
        <nav aria-label="Filtrar por rol" className="flex flex-wrap gap-2">
          <Link href={hrefFiltro()} className={filtro()} aria-current={!rol ? 'true' : undefined}>
            Todos
          </Link>
          {ROLES.map((r) => (
            <Link
              key={r}
              href={hrefFiltro(r)}
              className={filtro(r)}
              aria-current={rol === r ? 'true' : undefined}
            >
              {ETIQUETA_ROL[r]}
            </Link>
          ))}
        </nav>
      </div>

      {usuarios.length === 0 ? (
        <Vacio>No hay usuarios que coincidan con la búsqueda.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Nombre</TableHead>
              <TableHead>Nombre de usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Fecha registro</TableHead>
              <TableHead>Última actualización</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const nombre = `${u.name} ${u.lastname}`
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/usuarios/${u.id}`}
                      className="font-medium text-brand-blue hover:underline"
                    >
                      {nombre}
                    </Link>
                    {u.id === yo.id && <span className="ml-1 text-xs text-gray-500">(tú)</span>}
                  </TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{isRol(u.role) && <BadgeRol rol={u.role} />}</TableCell>
                  <TableCell>{u.phone || '—'}</TableCell>
                  <TableCell>{formatearFechaHora(u.createdAt)}</TableCell>
                  <TableCell>{formatearFechaHora(u.updatedAt)}</TableCell>
                  <TableCell>
                    <SwitchEstado
                      id={u.id}
                      activo={u.active}
                      esPropio={u.id === yo.id}
                      etiqueta={nombre}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      <Paginacion
        pagina={pagina}
        paginas={paginas}
        total={total}
        ruta="/dashboard/usuarios"
        params={{ q, rol }}
      />
    </Panel>
  )
}

export default enSuspense(UsuariosPage)
