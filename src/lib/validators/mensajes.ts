import { z } from 'zod'

/** Pestañas de la bandeja: cada una corresponde a una tabla/origen. */
export const TIPOS_MENSAJE = ['contacto', 'cotizacion', 'solicitud'] as const
export type TipoMensaje = (typeof TIPOS_MENSAJE)[number]

export const TITULOS_TIPO: Record<TipoMensaje, string> = {
  contacto: 'Contacto',
  cotizacion: 'Cotización',
  solicitud: 'Solicitud de registro',
}

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

/** Filtros desde la URL (searchParams): todo es opcional y lo inválido se ignora. */
export const filtrosMensajesSchema = z.object({
  tipo: z.enum(TIPOS_MENSAJE).catch('contacto'),
  q: z.string().trim().max(100).optional().catch(undefined),
  desde: fecha,
  hasta: fecha,
  estado: z.enum(['todos', 'no-leidos']).catch('todos'),
  pagina: z.coerce.number().int().min(1).max(10_000).catch(1),
})
export type FiltrosMensajes = z.infer<typeof filtrosMensajesSchema>

export const refMensajeSchema = z.object({
  tipo: z.enum(TIPOS_MENSAJE),
  id: z.coerce.number().int().positive(),
})
