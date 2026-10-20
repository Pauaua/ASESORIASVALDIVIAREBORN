import Link from 'next/link'
import { enSuspense } from '@/components/dashboard/carga'
import { Buscador } from '@/components/dashboard/formulario'
import { ExportarCsv, FiltrosMensajes, ListaMensajes } from '@/components/dashboard/mensajes'
import { Paginacion, Panel, param, Vacio } from '@/components/dashboard/panel'
import { nombreServicio } from '@/content/servicios'
import { contarNoLeidos, listarMensajes } from '@/lib/data/mensajes'
import { formatearFechaHora } from '@/lib/fechas'
import { can } from '@/lib/rbac'
import { requirePagina } from '@/lib/session'
import { cn } from '@/lib/utils'
import { filtrosMensajesSchema, TIPOS_MENSAJE, TITULOS_TIPO } from '@/lib/validators/mensajes'

export const metadata = { title: 'Mensajes' }

/** Bandeja de los formularios públicos: contacto, cotización y solicitudes de registro. */
async function MensajesPage({ searchParams }: PageProps<'/dashboard/mensajes'>) {
  const yo = await requirePagina('mensajes.ver')
  const sp = await searchParams
  const filtros = filtrosMensajesSchema.parse({
    tipo: param(sp.tipo),
    q: param(sp.q),
    desde: param(sp.desde),
    hasta: param(sp.hasta),
    estado: param(sp.estado),
    pagina: param(sp.pagina),
  })
  const [{ mensajes, total, paginas }, noLeidos] = await Promise.all([
    listarMensajes(filtros),
    contarNoLeidos(),
  ])

  const paramsComunes = {
    q: filtros.q,
    desde: filtros.desde,
    hasta: filtros.hasta,
    estado: filtros.estado === 'todos' ? undefined : filtros.estado,
  }

  return (
    <Panel
      titulo="MENSAJES RECIBIDOS"
      acciones={
        can(yo.rol, 'mensajes.exportar') && (
          <ExportarCsv filtros={{ ...filtros, pagina: 1 }} nombre={`mensajes-${filtros.tipo}`} />
        )
      }
    >
      <nav aria-label="Tipo de mensaje" className="mb-4 flex flex-wrap gap-1 border-b">
        {TIPOS_MENSAJE.map((tipo) => {
          const activo = tipo === filtros.tipo
          return (
            <Link
              key={tipo}
              href={`/dashboard/mensajes?tipo=${tipo}`}
              aria-current={activo ? 'page' : undefined}
              className={cn(
                '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm',
                activo
                  ? 'border-brand-blue font-semibold text-brand-blue'
                  : 'border-transparent text-gray-600 hover:text-brand-blue',
              )}
            >
              {TITULOS_TIPO[tipo]}
              {noLeidos[tipo] > 0 && (
                <span className="rounded-full bg-brand-amber px-2 text-xs font-bold text-brand-blue">
                  {noLeidos[tipo]}
                  <span className="sr-only"> sin leer</span>
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Buscador placeholder="Buscar por nombre o correo" className="lg:w-80" />
        <FiltrosMensajes />
      </div>

      {mensajes.length === 0 ? (
        <Vacio>No hay mensajes que coincidan con los filtros.</Vacio>
      ) : (
        <ListaMensajes
          permisos={{
            eliminar: can(yo.rol, 'mensajes.eliminar'),
            crearUsuario: can(yo.rol, 'mensajes.crearUsuario'),
          }}
          mensajes={mensajes.map((m) => ({
            ...m,
            servicio: m.servicio ? nombreServicio(m.servicio) : null,
            fecha: formatearFechaHora(m.createdAt),
          }))}
        />
      )}
      <Paginacion
        pagina={filtros.pagina}
        paginas={paginas}
        total={total}
        ruta="/dashboard/mensajes"
        params={{ tipo: filtros.tipo, ...paramsComunes }}
      />
    </Panel>
  )
}

export default enSuspense(MensajesPage)
