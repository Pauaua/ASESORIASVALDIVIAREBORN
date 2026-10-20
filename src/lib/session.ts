import 'server-only'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { can, MENSAJES_REGLA, type Permiso, type Rol } from '@/lib/rbac'

export type UsuarioSesion = { id: number; rol: Rol; nombre: string; email: string }

/**
 * Usuario de la sesión actual o null. Deduplicado por request. Lee cookies: en páginas con Cache
 * Components debe llamarse dentro de un <Suspense>.
 */
export const getUsuario = cache(async (): Promise<UsuarioSesion | null> => {
  // Auth.js usa valores aleatorios antes de leer la cookie: se marca como request-time primero.
  await connection()
  const sesion = await auth()
  const id = Number(sesion?.user?.id)
  if (!sesion?.user || !Number.isInteger(id)) return null
  return {
    id,
    rol: sesion.user.role,
    nombre: sesion.user.name ?? '',
    email: sesion.user.email ?? '',
  }
})

/** Para páginas: exige sesión y permiso; si falta, redirige al login o a /unauthorized. */
export async function requirePagina(permiso: Permiso): Promise<UsuarioSesion> {
  const usuario = await getUsuario()
  if (!usuario) redirect('/auth/login')
  if (!can(usuario.rol, permiso)) redirect('/unauthorized')
  return usuario
}

/** Error de autorización que las Server Actions traducen a una respuesta 401/403. */
export class ErrorAutorizacion extends Error {
  constructor(
    readonly status: 401 | 403,
    message: string,
  ) {
    super(message)
    this.name = 'ErrorAutorizacion'
  }
}

/**
 * Para Server Actions y Route Handlers: exige sesión y que el rol tenga TODOS los permisos.
 * Lanza ErrorAutorizacion (401 sin sesión, 403 sin permiso).
 */
export async function requirePermiso(...permisos: Permiso[]): Promise<UsuarioSesion> {
  const usuario = await getUsuario()
  if (!usuario) throw new ErrorAutorizacion(401, 'Tu sesión expiró. Vuelve a iniciar sesión.')
  if (!permisos.every((p) => can(usuario.rol, p))) {
    throw new ErrorAutorizacion(403, MENSAJES_REGLA.sinPermiso)
  }
  return usuario
}
