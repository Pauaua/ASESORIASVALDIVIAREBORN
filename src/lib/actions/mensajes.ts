'use server'

import { refresh } from 'next/cache'
import { nombreServicio } from '@/content/servicios'
import { db } from '@/lib/db'
import { listarMensajes } from '@/lib/data/mensajes'
import { requirePermiso } from '@/lib/session'
import { filtrosMensajesSchema, refMensajeSchema } from '@/lib/validators/mensajes'
import { ejecutar, exito, fallo, type Resultado } from './resultado'

/** Marca un mensaje como leído o no leído (ADMIN y TEAM). */
export async function marcarLeido(ref: unknown, leido: unknown): Promise<Resultado> {
  return ejecutar('marcarLeido', async () => {
    await requirePermiso('mensajes.marcarLeido')
    const parsed = refMensajeSchema.safeParse(ref)
    if (!parsed.success || typeof leido !== 'boolean') return fallo(400, 'Datos inválidos.')
    const { tipo, id } = parsed.data
    // updateMany con el origen evita marcar un mensaje de otra pestaña con el mismo id.
    const where =
      tipo === 'cotizacion'
        ? { id }
        : {
            id,
            origen: tipo === 'solicitud' ? ('solicitud_registro' as const) : ('contacto' as const),
          }
    const r =
      tipo === 'cotizacion'
        ? await db.cotizationForm.updateMany({ where, data: { leido } })
        : await db.contactForm.updateMany({ where, data: { leido } })
    if (r.count === 0) return fallo(404, 'El mensaje no existe.')
    refresh()
    return exito(leido ? 'Marcado como leído.' : 'Marcado como no leído.')
  })
}

/** Elimina un mensaje (solo ADMIN). */
export async function eliminarMensaje(ref: unknown): Promise<Resultado> {
  return ejecutar('eliminarMensaje', async () => {
    await requirePermiso('mensajes.eliminar')
    const parsed = refMensajeSchema.safeParse(ref)
    if (!parsed.success) return fallo(400, 'Datos inválidos.')
    const { tipo, id } = parsed.data
    const r =
      tipo === 'cotizacion'
        ? await db.cotizationForm.deleteMany({ where: { id } })
        : await db.contactForm.deleteMany({
            where: { id, origen: tipo === 'solicitud' ? 'solicitud_registro' : 'contacto' },
          })
    if (r.count === 0) return fallo(404, 'El mensaje no existe.')
    refresh()
    return exito('Mensaje eliminado.')
  })
}

/** Evita que Excel interprete celdas como fórmulas (inyección CSV). */
function celda(valor: unknown) {
  let texto = valor instanceof Date ? valor.toISOString() : String(valor ?? '')
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return `"${texto.replace(/"/g, '""')}"`
}

/** Exporta la pestaña con los filtros actuales como CSV (solo ADMIN). */
export async function exportarMensajesCsv(filtros: unknown): Promise<Resultado<string>> {
  return ejecutar('exportarMensajesCsv', async () => {
    await requirePermiso('mensajes.exportar')
    const f = filtrosMensajesSchema.parse(filtros ?? {})
    const { mensajes } = await listarMensajes(f, { paginar: false })
    const conServicio = f.tipo === 'cotizacion'
    const encabezado = [
      'Fecha',
      'Nombre',
      'Apellido',
      'Correo',
      'Teléfono',
      ...(conServicio ? ['Servicio'] : []),
      'Mensaje',
      'Leído',
    ]
    const filas = mensajes.map((m) =>
      [
        m.createdAt,
        m.nombre,
        m.apellido,
        m.correo,
        m.telefono,
        ...(conServicio ? [m.servicio ? nombreServicio(m.servicio) : ''] : []),
        m.mensaje,
        m.leido ? 'Sí' : 'No',
      ]
        .map(celda)
        .join(';'),
    )
    // BOM para que Excel abra bien los acentos; ";" es el separador habitual en Excel es-CL.
    const csv = `\uFEFF${[encabezado.map(celda).join(';'), ...filas].join('\r\n')}`
    return exito(undefined, csv)
  })
}
