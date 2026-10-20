import { Plus } from 'lucide-react'
import Link from 'next/link'
import { enSuspense } from '@/components/dashboard/carga'
import { AbrirCarpeta, EditarCliente } from '@/components/dashboard/clientes'
import { Buscador } from '@/components/dashboard/formulario'
import { Paginacion, Panel, param, Vacio } from '@/components/dashboard/panel'
import { SwitchEstado } from '@/components/dashboard/usuarios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listarUsuarios } from '@/lib/data/usuarios'
import { can } from '@/lib/rbac'
import { formatearRut } from '@/lib/rut'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Clientes' }

/** ADMIN: listado completo con estado y edición comercial. TEAM: lectura + edición del Drive. */
async function ClientesPage({ searchParams }: PageProps<'/dashboard/clientes'>) {
  const yo = await requirePagina('clientes.ver')
  const sp = await searchParams
  const q = param(sp.q)?.slice(0, 100)
  const pagina = Math.max(1, Number(param(sp.pagina)) || 1)
  const { usuarios: clientes, total, paginas } = await listarUsuarios({ q, rol: 'CLIENT', pagina })

  const puedeEstado = can(yo.rol, 'usuarios.activar')
  const comercial = can(yo.rol, 'clientes.editarComercial')

  return (
    <Panel
      titulo="LISTADO DE CLIENTES"
      acciones={
        can(yo.rol, 'usuarios.crear') && (
          <Link
            href="/dashboard/usuarios/nuevo"
            className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-4 py-2 text-sm text-white transition-colors hover:bg-brand-green hover:text-brand-blue"
          >
            <Plus className="size-4" aria-hidden="true" /> Nuevo cliente
          </Link>
        )
      }
    >
      <Buscador
        placeholder="Buscar por nombre, usuario, correo o empresa"
        className="mb-4 lg:w-96"
      />

      {clientes.length === 0 ? (
        <Vacio>No hay clientes que coincidan con la búsqueda.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Nombre</TableHead>
              <TableHead>Nombre de usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Correo empresa</TableHead>
              <TableHead>Teléfono empresa</TableHead>
              {puedeEstado && <TableHead>Estado</TableHead>}
              <TableHead>Link Drive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => {
              const nombre = `${c.name} ${c.lastname}`
              return (
                <TableRow key={c.id} className={c.active ? undefined : 'text-gray-400'}>
                  <TableCell className="font-medium">
                    {nombre}
                    {!c.active && <span className="ml-1 text-xs">(inactivo)</span>}
                  </TableCell>
                  <TableCell>{c.username}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone || '—'}</TableCell>
                  <TableCell>
                    {c.company || '—'}
                    {c.companyRUT && (
                      <span className="block text-xs text-gray-500">
                        {formatearRut(c.companyRUT)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{c.companyEmail || '—'}</TableCell>
                  <TableCell>{c.companyPhone || '—'}</TableCell>
                  {puedeEstado && (
                    <TableCell>
                      <SwitchEstado
                        id={c.id}
                        activo={c.active}
                        esPropio={c.id === yo.id}
                        etiqueta={nombre}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.driveURL && <AbrirCarpeta url={c.driveURL} />}
                      <EditarCliente
                        id={c.id}
                        nombre={nombre}
                        comercial={comercial}
                        valores={{
                          company: c.company ?? '',
                          companyEmail: c.companyEmail ?? '',
                          companyPhone: c.companyPhone ?? '',
                          companyRUT: c.companyRUT ? formatearRut(c.companyRUT) : '',
                          driveURL: c.driveURL ?? '',
                        }}
                      />
                    </div>
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
        ruta="/dashboard/clientes"
        params={{ q }}
      />
    </Panel>
  )
}

export default enSuspense(ClientesPage)
