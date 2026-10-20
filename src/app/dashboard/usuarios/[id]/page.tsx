import { notFound } from 'next/navigation'
import { enSuspense } from '@/components/dashboard/carga'
import { Panel } from '@/components/dashboard/panel'
import {
  BadgeRol,
  EliminarUsuario,
  FormularioEditarUsuario,
  SwitchEstado,
} from '@/components/dashboard/usuarios'
import { obtenerUsuario } from '@/lib/data/usuarios'
import { formatearFechaHora } from '@/lib/fechas'
import { isRol, MENSAJES_REGLA } from '@/lib/rbac'
import { formatearRut } from '@/lib/rut'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Editar usuario' }

async function EditarUsuarioPage({ params }: PageProps<'/dashboard/usuarios/[id]'>) {
  const yo = await requirePagina('usuarios.editar')
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const u = await obtenerUsuario(id)
  if (!u || !isRol(u.role)) notFound()
  const esPropio = u.id === yo.id
  const nombre = `${u.name} ${u.lastname}`

  return (
    <div className="space-y-6">
      <Panel
        titulo={`EDITAR USUARIO: ${nombre.toUpperCase()}`}
        acciones={
          <div className="flex items-center gap-3">
            <BadgeRol rol={u.role} />
            <span className="flex items-center gap-2 text-sm">
              {u.active ? 'Activo' : 'Inactivo'}
              <SwitchEstado id={u.id} activo={u.active} esPropio={esPropio} etiqueta={nombre} />
            </span>
          </div>
        }
      >
        <p className="mb-6 text-sm text-gray-500">
          Registrado el {formatearFechaHora(u.createdAt)} · última actualización{' '}
          {formatearFechaHora(u.updatedAt)}
        </p>
        <FormularioEditarUsuario
          id={u.id}
          esPropio={esPropio}
          valores={{
            name: u.name,
            lastname: u.lastname,
            username: u.username,
            email: u.email,
            phone: u.phone ?? '',
            role: u.role,
            image: u.image,
            company: u.company ?? '',
            companyEmail: u.companyEmail ?? '',
            companyPhone: u.companyPhone ?? '',
            companyRUT: u.companyRUT ? formatearRut(u.companyRUT) : '',
            driveURL: u.driveURL ?? '',
          }}
        />
      </Panel>

      <section className="rounded-lg border border-red-200 bg-white p-4 shadow-md md:p-6">
        <h2 className="mb-2 text-lg font-bold text-red-700">Zona de peligro</h2>
        {esPropio ? (
          <p className="text-sm text-gray-600">{MENSAJES_REGLA.propiaEliminacion}</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              El borrado habitual es desactivar al usuario (conserva su historial). Eliminar lo
              borra de la base de datos para siempre.
            </p>
            <EliminarUsuario id={u.id} email={u.email} />
          </>
        )}
      </section>
    </div>
  )
}

export default enSuspense(EditarUsuarioPage)
