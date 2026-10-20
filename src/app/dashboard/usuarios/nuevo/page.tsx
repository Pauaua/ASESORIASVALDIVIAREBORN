import { enSuspense } from '@/components/dashboard/carga'
import { Panel, param } from '@/components/dashboard/panel'
import { FormularioNuevoUsuario, type PrecargaUsuario } from '@/components/dashboard/usuarios'
import { obtenerSolicitud } from '@/lib/data/mensajes'
import { can } from '@/lib/rbac'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Nuevo usuario' }

/** Alta de usuario. Con ?solicitud=ID precarga los datos de una solicitud de registro. */
async function NuevoUsuarioPage({ searchParams }: PageProps<'/dashboard/usuarios/nuevo'>) {
  const yo = await requirePagina('usuarios.crear')
  const solicitudId = Number(param((await searchParams).solicitud))

  let precarga: PrecargaUsuario | undefined
  if (Number.isInteger(solicitudId) && solicitudId > 0 && can(yo.rol, 'mensajes.crearUsuario')) {
    const s = await obtenerSolicitud(solicitudId)
    if (s) {
      precarga = {
        name: s.nombre,
        lastname: s.apellido,
        email: s.correo,
        phone: s.telefono ?? '',
        role: 'CLIENT',
      }
    }
  }

  return (
    <Panel titulo="NUEVO USUARIO">
      {precarga && (
        <p role="status" className="mb-4 rounded bg-brand-green/30 p-3 text-sm text-brand-blue">
          Datos precargados desde la solicitud de registro. Completa el nombre de usuario y la
          contraseña.
        </p>
      )}
      <FormularioNuevoUsuario precarga={precarga} />
    </Panel>
  )
}

export default enSuspense(NuevoUsuarioPage)
