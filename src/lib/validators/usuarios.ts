import { z } from 'zod'
import { ROLES_ASIGNABLES } from '@/lib/rbac'
import { normalizarRut } from '@/lib/rut'
import { claveNuevaSchema, emailSchema } from './auth'

/**
 * Esquemas de usuarios y perfiles, por rol. Cada Server Action usa el esquema de su caso: los
 * campos que no están en el esquema se descartan (Zod elimina claves desconocidas), así que
 * `active`, `role`, `driveURL` o `image` nunca llegan desde el formulario de perfil.
 */

const requerido = 'Este campo es requerido'

const texto = (max: number) =>
  z.string({ error: requerido }).trim().min(1, requerido).max(max, `Máximo ${max} caracteres`)

/** Texto opcional: vacío se guarda como null. */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .nullish()
    .transform((v) => (v ? v : null))

const telefono = z
  .string()
  .trim()
  .max(20, 'Máximo 20 caracteres')
  .regex(/^[0-9+()\s-]*$/, 'Solo números, espacios y + ( ) -')
  .nullish()
  .transform((v) => (v ? v : null))

const emailOpcional = z
  .string()
  .trim()
  .max(254, 'Correo demasiado largo')
  .nullish()
  .transform((v) => (v ? v.toLowerCase() : null))
  .pipe(z.email('Correo electrónico inválido').nullable())

const rutOpcional = z
  .string()
  .trim()
  .max(20, 'RUT inválido')
  .nullish()
  .transform((v, ctx) => {
    if (!v) return null
    const normalizado = normalizarRut(v)
    if (!normalizado) {
      ctx.addIssue({ code: 'custom', message: 'RUT inválido (revisa el dígito verificador)' })
      return z.NEVER
    }
    return normalizado
  })

/** Contraseña opcional: vacía = no cambiar. */
const claveOpcional = z
  .string()
  .nullish()
  .transform((v) => (v ? v : undefined))
  .pipe(claveNuevaSchema.optional())

export const DOMINIOS_DRIVE = ['drive.google.com', 'docs.google.com'] as const

export const driveUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((v, ctx) => {
    if (!v) return null
    try {
      const url = new URL(v)
      if (url.protocol === 'https:' && (DOMINIOS_DRIVE as readonly string[]).includes(url.host)) {
        return url.toString()
      }
    } catch {
      // cae al error de abajo
    }
    ctx.addIssue({
      code: 'custom',
      message: 'Debe ser un enlace https://drive.google.com/… o https://docs.google.com/…',
    })
    return z.NEVER
  })

export const datosPersonalesSchema = z.object({
  username: texto(50).regex(/^\S+$/, 'Sin espacios'),
  name: texto(100),
  lastname: texto(100),
  phone: telefono,
  email: emailSchema,
  password: claveOpcional,
})

export const datosComercialesSchema = z.object({
  company: textoOpcional(150),
  companyEmail: emailOpcional,
  companyPhone: telefono,
  companyRUT: rutOpcional,
})

/** Perfil propio de ADMIN y TEAM: solo datos personales. */
export const perfilPersonalSchema = datosPersonalesSchema
/** Perfil propio de CLIENT: datos personales + información comercial. */
export const perfilClienteSchema = datosPersonalesSchema.extend(datosComercialesSchema.shape)
export type PerfilClienteInput = z.input<typeof perfilClienteSchema>
export type PerfilClienteOutput = z.output<typeof perfilClienteSchema>

const camposCliente = datosComercialesSchema.extend({ driveURL: driveUrlSchema }).shape

/** Alta de usuario por ADMIN (TEAM o CLIENT). Empresa y Drive solo aplican a CLIENT. */
export const crearUsuarioSchema = datosPersonalesSchema
  .extend({
    password: claveNuevaSchema,
    role: z.enum(ROLES_ASIGNABLES, { error: 'Elige un rol' }),
    image: z.url().max(2048).optional().nullable(),
    ...camposCliente,
  })
  .transform((d) =>
    d.role === 'CLIENT'
      ? d
      : {
          ...d,
          company: null,
          companyEmail: null,
          companyPhone: null,
          companyRUT: null,
          driveURL: null,
        },
  )
export type CrearUsuarioInput = z.input<typeof crearUsuarioSchema>
export type CrearUsuarioOutput = z.output<typeof crearUsuarioSchema>

/** Edición de otro usuario por ADMIN. La contraseña vacía no se cambia. */
export const editarUsuarioSchema = datosPersonalesSchema.extend({
  role: z.enum(['ADMIN', 'TEAM', 'CLIENT']),
  image: z.url().max(2048).optional().nullable(),
  ...camposCliente,
})
export type EditarUsuarioInput = z.input<typeof editarUsuarioSchema>
export type EditarUsuarioOutput = z.output<typeof editarUsuarioSchema>

/** Edición de cliente: ADMIN edita comercial + Drive; TEAM solo Drive. */
export const editarClienteAdminSchema = z.object(camposCliente)
export type EditarClienteInput = z.input<typeof editarClienteAdminSchema>
export type EditarClienteOutput = z.output<typeof editarClienteAdminSchema>
export const editarClienteDriveSchema = z.object({ driveURL: driveUrlSchema })

export const idSchema = z.coerce.number().int().positive()
