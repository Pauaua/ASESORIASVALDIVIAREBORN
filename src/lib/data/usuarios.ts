import 'server-only'
import { db } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'

/**
 * Campos de usuario que se pueden mostrar. NUNCA incluye `password`, `resetToken` ni
 * `resetTokenExpires`: toda lectura de usuarios para la UI usa este select.
 */
export const SELECT_USUARIO = {
  id: true,
  email: true,
  username: true,
  name: true,
  lastname: true,
  phone: true,
  image: true,
  role: true,
  active: true,
  company: true,
  companyEmail: true,
  companyPhone: true,
  companyRUT: true,
  driveURL: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect

// Falla en compilación si alguien agrega un campo sensible al select.
type CamposSensibles = Extract<
  keyof typeof SELECT_USUARIO,
  'password' | 'resetToken' | 'resetTokenExpires'
>
const sinSensibles: [CamposSensibles] extends [never] ? true : never = true
void sinSensibles

export type UsuarioDTO = Prisma.UserGetPayload<{ select: typeof SELECT_USUARIO }>

export const POR_PAGINA = 20

export type FiltroUsuarios = {
  q?: string
  rol?: 'ADMIN' | 'TEAM' | 'CLIENT'
  pagina?: number
}

function whereBusqueda(q?: string): Prisma.UserWhereInput {
  if (!q) return {}
  const contains = { contains: q, mode: 'insensitive' as const }
  return {
    OR: [
      { name: contains },
      { lastname: contains },
      { username: contains },
      { email: contains },
      { company: contains },
    ],
  }
}

/** Listado paginado con búsqueda. La autorización la hace quien llama (página o acción). */
export async function listarUsuarios({ q, rol, pagina = 1 }: FiltroUsuarios) {
  const where: Prisma.UserWhereInput = { ...whereBusqueda(q), ...(rol ? { role: rol } : {}) }
  const [total, usuarios] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: SELECT_USUARIO,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (Math.max(1, pagina) - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ])
  return { total, usuarios, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) }
}

export function obtenerUsuario(id: number) {
  return db.user.findUnique({ where: { id }, select: SELECT_USUARIO })
}

export function contarAdminsActivos(tx: Prisma.TransactionClient = db) {
  return tx.user.count({ where: { role: 'ADMIN', active: true } })
}

/**
 * Errores de unicidad (correo y username, sin distinguir mayúsculas) excluyendo al propio
 * usuario. Devuelve fieldErrors listos para el formulario, o null si no hay conflicto.
 */
export async function conflictosUnicidad(
  datos: { email: string; username: string },
  excluirId?: number,
) {
  const otros = await db.user.findMany({
    where: {
      id: excluirId ? { not: excluirId } : undefined,
      OR: [
        { email: { equals: datos.email, mode: 'insensitive' } },
        { username: { equals: datos.username, mode: 'insensitive' } },
      ],
    },
    select: { email: true, username: true },
  })
  if (otros.length === 0) return null
  const errores: Record<string, string[]> = {}
  if (otros.some((o) => o.email.toLowerCase() === datos.email.toLowerCase())) {
    errores.email = ['El correo ya está registrado']
  }
  if (otros.some((o) => o.username.toLowerCase() === datos.username.toLowerCase())) {
    errores.username = ['El nombre de usuario ya está registrado']
  }
  return errores
}
