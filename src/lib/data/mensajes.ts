import 'server-only'
import { db } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import type { FiltrosMensajes, TipoMensaje } from '@/lib/validators/mensajes'

export const MENSAJES_POR_PAGINA = 20

export type MensajeDTO = {
  id: number
  tipo: TipoMensaje
  nombre: string
  apellido: string
  correo: string
  telefono: string | null
  mensaje: string
  servicio: string | null
  leido: boolean
  createdAt: Date
}

/** Fechas del filtro en hora de Chile: "hasta" incluye el día completo. */
function rangoFechas(desde?: string, hasta?: string): Prisma.DateTimeFilter | undefined {
  if (!desde && !hasta) return undefined
  return {
    ...(desde ? { gte: new Date(`${desde}T00:00:00-03:00`) } : {}),
    ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999-03:00`) } : {}),
  }
}

function whereComun(f: Omit<FiltrosMensajes, 'tipo' | 'pagina'>) {
  const contains = f.q ? { contains: f.q, mode: 'insensitive' as const } : undefined
  return {
    ...(contains
      ? { OR: [{ nombre: contains }, { apellido: contains }, { correo: contains }] }
      : {}),
    ...(f.estado === 'no-leidos' ? { leido: false } : {}),
    ...(rangoFechas(f.desde, f.hasta) ? { createdAt: rangoFechas(f.desde, f.hasta) } : {}),
  }
}

const SELECT_FORM = {
  id: true,
  nombre: true,
  apellido: true,
  correo: true,
  telefono: true,
  mensaje: true,
  leido: true,
  createdAt: true,
} as const

/** Mensajes de una pestaña con filtros. `paginar: false` trae todos (exportación CSV). */
export async function listarMensajes(
  f: FiltrosMensajes,
  { paginar = true }: { paginar?: boolean } = {},
): Promise<{ total: number; paginas: number; mensajes: MensajeDTO[] }> {
  const pag: { skip?: number; take?: number } = paginar
    ? { skip: (f.pagina - 1) * MENSAJES_POR_PAGINA, take: MENSAJES_POR_PAGINA }
    : {}
  const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }]

  if (f.tipo === 'cotizacion') {
    const where: Prisma.CotizationFormWhereInput = whereComun(f)
    const [total, filas] = await Promise.all([
      db.cotizationForm.count({ where }),
      db.cotizationForm.findMany({
        where,
        orderBy,
        ...pag,
        select: { ...SELECT_FORM, servicio: true },
      }),
    ])
    return {
      total,
      paginas: Math.max(1, Math.ceil(total / MENSAJES_POR_PAGINA)),
      mensajes: filas.map((m) => ({ ...m, tipo: 'cotizacion' })),
    }
  }

  const where: Prisma.ContactFormWhereInput = {
    ...whereComun(f),
    origen: f.tipo === 'solicitud' ? 'solicitud_registro' : 'contacto',
  }
  const [total, filas] = await Promise.all([
    db.contactForm.count({ where }),
    db.contactForm.findMany({ where, orderBy, ...pag, select: SELECT_FORM }),
  ])
  return {
    total,
    paginas: Math.max(1, Math.ceil(total / MENSAJES_POR_PAGINA)),
    mensajes: filas.map((m) => ({ ...m, tipo: f.tipo, servicio: null })),
  }
}

/** No leídos por pestaña (para las pestañas y el contador del sidebar). */
export async function contarNoLeidos(): Promise<Record<TipoMensaje, number>> {
  const [contacto, solicitud, cotizacion] = await Promise.all([
    db.contactForm.count({ where: { leido: false, origen: 'contacto' } }),
    db.contactForm.count({ where: { leido: false, origen: 'solicitud_registro' } }),
    db.cotizationForm.count({ where: { leido: false } }),
  ])
  return { contacto, solicitud, cotizacion }
}

/** Solicitud de registro para precargar el alta de usuario. */
export function obtenerSolicitud(id: number) {
  return db.contactForm.findFirst({
    where: { id, origen: 'solicitud_registro' },
    select: { nombre: true, apellido: true, correo: true, telefono: true },
  })
}
