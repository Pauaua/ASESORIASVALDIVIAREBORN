import { redirect } from 'next/navigation'
import { enSuspense } from '@/components/dashboard/carga'
import { Panel } from '@/components/dashboard/panel'
import { FormularioPerfil, FotoPerfil } from '@/components/dashboard/perfil'
import { obtenerUsuario } from '@/lib/data/usuarios'
import { can } from '@/lib/rbac'
import { formatearRut } from '@/lib/rut'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Perfil' }

async function PerfilPage() {
  const yo = await requirePagina('perfil.propio')
  const u = await obtenerUsuario(yo.id)
  if (!u) redirect('/auth/login')

  return (
    <Panel titulo={`BIENVENIDO/A, ${u.name.toUpperCase()} ${u.lastname.toUpperCase()}`}>
      <FotoPerfil imagen={u.image} />
      <FormularioPerfil
        comercial={can(yo.rol, 'perfil.comercial')}
        valores={{
          username: u.username,
          name: u.name,
          lastname: u.lastname,
          phone: u.phone ?? '',
          email: u.email,
          company: u.company ?? '',
          companyEmail: u.companyEmail ?? '',
          companyPhone: u.companyPhone ?? '',
          companyRUT: u.companyRUT ? formatearRut(u.companyRUT) : '',
        }}
      />
    </Panel>
  )
}

export default enSuspense(PerfilPage)
