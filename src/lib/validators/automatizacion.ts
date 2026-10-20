import { z } from 'zod'
import { validarCuerpoYDv, validarRut } from '@/lib/rut'

/**
 * Validación de los procesos de automatización SII. Se usa en el cliente y en /api/automation.
 * Los RUT se validan (módulo 11) pero se envían al daemon tal como se escribieron.
 *
 * La clave SII solo se valida en forma: nunca se registra, persiste ni devuelve.
 */

const requerido = 'Este campo es requerido'

const texto = (max: number) =>
  z.string({ error: requerido }).trim().min(1, requerido).max(max, `Máximo ${max} caracteres`)

export const rutSchema = texto(15).refine(validarRut, 'RUT inválido (revisa el dígito verificador)')

const claveSii = z.string({ error: requerido }).min(1, requerido).max(100, 'Clave demasiado larga')

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

const dosDigitos = (n: number) => String(n).padStart(2, '0')

export const prestacionSchema = z.object({
  glosa: z.string().trim().max(500, 'Máximo 500 caracteres'),
  valor: z.string().trim().max(20, 'Valor demasiado largo'),
})

export const boletaIndividualSchema = z
  .object({
    rut: rutSchema,
    clave: claveSii,
    headless: z.boolean(),
    rut_dest: z
      .string({ error: requerido })
      .trim()
      .regex(/^\d{1,2}\.?\d{3}\.?\d{3}$/, 'Solo el número, sin dígito verificador'),
    dv_dest: z
      .string({ error: requerido })
      .trim()
      .regex(/^[\dkK]$/, 'Un dígito o K'),
    nombres_dest: texto(150),
    domicilio: texto(200),
    region: z.string().trim().max(100),
    comuna: texto(100),
    fecha_dia: z.coerce
      .number()
      .int()
      .min(1, 'Día inválido')
      .max(31, 'Día inválido')
      .transform(dosDigitos),
    fecha_mes: z.coerce.number().int().min(1).max(12).transform(dosDigitos),
    fecha_anio: z.coerce
      .number()
      .int()
      .min(2020, 'Año inválido')
      .max(2099, 'Año inválido')
      .transform(String),
    prestaciones: z.array(prestacionSchema).max(4),
  })
  .superRefine((d, ctx) => {
    if (!validarCuerpoYDv(d.rut_dest, d.dv_dest)) {
      ctx.addIssue({ code: 'custom', path: ['dv_dest'], message: 'El DV no corresponde al RUT' })
    }
    const conGlosa = d.prestaciones.filter((p) => p.glosa)
    if (conGlosa.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['prestaciones', 0, 'glosa'],
        message: 'Ingresa al menos una prestación.',
      })
    }
    d.prestaciones.forEach((p, i) => {
      if (p.glosa && !/^\$?\s*\d[\d.]*$/.test(p.valor)) {
        ctx.addIssue({
          code: 'custom',
          path: ['prestaciones', i, 'valor'],
          message: 'Valor en pesos, solo números',
        })
      }
    })
    const fecha = new Date(Number(d.fecha_anio), Number(d.fecha_mes) - 1, Number(d.fecha_dia))
    if (fecha.getDate() !== Number(d.fecha_dia)) {
      ctx.addIssue({ code: 'custom', path: ['fecha_dia'], message: 'La fecha no existe' })
    }
  })
  // Al daemon solo van las prestaciones con glosa (como en el sitio anterior).
  .transform((d) => ({ ...d, prestaciones: d.prestaciones.filter((p) => p.glosa) }))

export type BoletaIndividualInput = z.input<typeof boletaIndividualSchema>
export type BoletaIndividualOutput = z.output<typeof boletaIndividualSchema>

export const facturaIndividualSchema = z
  .object({
    rut_empresa: rutSchema,
    rut_usuario: z
      .string()
      .trim()
      .max(15)
      .refine((v) => !v || validarRut(v), 'RUT inválido (revisa el dígito verificador)'),
    clave: claveSii,
  })
  // Si el RUT de usuario se deja vacío, se usa el de la empresa.
  .transform((d) => ({ ...d, rut_usuario: d.rut_usuario || d.rut_empresa }))

export type FacturaIndividualInput = z.input<typeof facturaIndividualSchema>
export type FacturaIndividualOutput = z.output<typeof facturaIndividualSchema>

export const jobIdSchema = z.string().regex(/^[\w-]{1,64}$/, 'Job inválido')

/** Archivos masivos: Excel o CSV. En Vercel el cuerpo de una función no puede superar 4,5 MB. */
export const EXCEL = {
  extensiones: ['.xlsx', '.xls', '.csv'],
  accept: '.xlsx,.xls,.csv',
  maxBytes: 10 * 1024 * 1024,
  descripcion: '.xlsx, .xls o .csv de hasta 10 MB',
} as const

export function validarExcel(archivo: { name: string; size: number }) {
  const nombre = archivo.name.toLowerCase()
  if (!EXCEL.extensiones.some((ext) => nombre.endsWith(ext))) {
    return `Formato no permitido. Usa ${EXCEL.descripcion}.`
  }
  if (archivo.size === 0) return 'El archivo está vacío.'
  if (archivo.size > EXCEL.maxBytes) return `El archivo supera el máximo (${EXCEL.descripcion}).`
  return null
}

export const ESTADOS_JOB = ['pending', 'running', 'done', 'error', 'stopped'] as const
export type EstadoJob = (typeof ESTADOS_JOB)[number]
export const ESTADOS_TERMINALES: readonly EstadoJob[] = ['done', 'error', 'stopped']
