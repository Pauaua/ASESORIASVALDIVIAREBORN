/**
 * Matriz de permisos: fuente de verdad de qué puede hacer cada rol.
 *
 * Principio: ADMIN tiene todos los poderes, TEAM solo algunos operativos y CLIENT únicamente lo
 * suyo. Se usa en tres lugares: en el servidor (Server Actions y Route Handlers, obligatorio), en
 * el proxy (redirecciones) y en la UI (ocultar lo que no corresponde). La UI nunca es la única
 * barrera.
 *
 * Este módulo es puro (sin BD ni sesión) para poder usarlo en cualquier entorno y probarlo.
 */

export const ROLES = ['ADMIN', 'TEAM', 'CLIENT'] as const
export type Rol = (typeof ROLES)[number]

/** Roles que un ADMIN puede asignar desde el panel. ADMIN solo se crea por seed/script. */
export const ROLES_ASIGNABLES = ['TEAM', 'CLIENT'] as const satisfies readonly Rol[]
export type RolAsignable = (typeof ROLES_ASIGNABLES)[number]

const TODOS: readonly Rol[] = ROLES
const ADMIN: readonly Rol[] = ['ADMIN']
const OPERATIVOS: readonly Rol[] = ['ADMIN', 'TEAM']

export const PERMISOS = {
  /** Ver y editar su propio perfil (datos personales y contraseña). */
  'perfil.propio': TODOS,
  /** Editar su propia información comercial (empresa, correo, teléfono, RUT empresa). */
  'perfil.comercial': ['CLIENT'],

  'usuarios.ver': ADMIN,
  'usuarios.crear': ADMIN,
  /** Editar datos de otro usuario, cambiar su rol o resetear su contraseña. */
  'usuarios.editar': ADMIN,
  /** Activar o desactivar a OTRO usuario. */
  'usuarios.activar': ADMIN,
  'usuarios.eliminar': ADMIN,

  /** ADMIN ve el listado completo; TEAM en solo lectura (sin switch de estado). */
  'clientes.ver': OPERATIVOS,
  'clientes.editarDrive': OPERATIVOS,
  'clientes.editarComercial': ADMIN,

  'recursos.ver': TODOS,
  'recursos.administrar': ADMIN,

  'servicios.ver': ADMIN,

  'mensajes.ver': OPERATIVOS,
  'mensajes.marcarLeido': OPERATIVOS,
  'mensajes.eliminar': ADMIN,
  'mensajes.exportar': ADMIN,
  /** "Crear usuario" desde una solicitud de registro. */
  'mensajes.crearUsuario': ADMIN,

  /** Automatización SII: boletas y facturas, individual y masivo, detener jobs. */
  'automatizacion.ejecutar': OPERATIVOS,

  'noticias.administrar': ADMIN,

  /** Estado del sistema (daemon, correo, variables configuradas sí/no). */
  'sistema.estado': ADMIN,
} as const satisfies Record<string, readonly Rol[]>

export type Permiso = keyof typeof PERMISOS

export function can(rol: Rol | null | undefined, permiso: Permiso): boolean {
  if (!rol) return false
  return (PERMISOS[permiso] as readonly Rol[]).includes(rol)
}

export function isRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor)
}

/* -------------------------------------------------------------------------------------------- */
/* Reglas sobre sí mismo y sobre el último ADMIN activo                                          */
/* -------------------------------------------------------------------------------------------- */

export type ResultadoRegla = { ok: true } | { ok: false; error: string }

export const MENSAJES_REGLA = {
  sinPermiso: 'No tienes permisos para realizar esta acción.',
  propioEstado: 'No puedes activar ni desactivar tu propia cuenta.',
  propioRol: 'No puedes cambiar tu propio rol.',
  propiaEliminacion: 'No puedes eliminar tu propia cuenta.',
  ultimoAdmin: 'Debe quedar al menos un administrador activo en el sistema.',
  rolNoAsignable: 'Solo se pueden asignar los roles Equipo o Cliente.',
} as const

type Actor = { id: number; rol: Rol }
type Objetivo = { id: number; rol: Rol; activo: boolean }

/**
 * ¿Puede `actor` cambiar el estado activo de `objetivo`?
 * `adminsActivos` es el número de ADMIN activos ANTES del cambio.
 */
export function puedeCambiarEstado(
  actor: Actor,
  objetivo: Objetivo,
  nuevoActivo: boolean,
  adminsActivos: number,
): ResultadoRegla {
  if (!can(actor.rol, 'usuarios.activar')) return { ok: false, error: MENSAJES_REGLA.sinPermiso }
  if (actor.id === objetivo.id) return { ok: false, error: MENSAJES_REGLA.propioEstado }
  if (dejariaSinAdmin(objetivo, { activo: nuevoActivo, rol: objetivo.rol }, adminsActivos)) {
    return { ok: false, error: MENSAJES_REGLA.ultimoAdmin }
  }
  return { ok: true }
}

/** ¿Puede `actor` cambiar el rol de `objetivo` a `nuevoRol`? */
export function puedeCambiarRol(
  actor: Actor,
  objetivo: Objetivo,
  nuevoRol: Rol,
  adminsActivos: number,
): ResultadoRegla {
  if (!can(actor.rol, 'usuarios.editar')) return { ok: false, error: MENSAJES_REGLA.sinPermiso }
  if (nuevoRol === objetivo.rol) return { ok: true }
  if (actor.id === objetivo.id) return { ok: false, error: MENSAJES_REGLA.propioRol }
  // Por el panel nunca se asciende a ADMIN.
  if (nuevoRol === 'ADMIN') return { ok: false, error: MENSAJES_REGLA.rolNoAsignable }
  if (dejariaSinAdmin(objetivo, { activo: objetivo.activo, rol: nuevoRol }, adminsActivos)) {
    return { ok: false, error: MENSAJES_REGLA.ultimoAdmin }
  }
  return { ok: true }
}

/** ¿Puede `actor` eliminar (físicamente) a `objetivo`? */
export function puedeEliminar(
  actor: Actor,
  objetivo: Objetivo,
  adminsActivos: number,
): ResultadoRegla {
  if (!can(actor.rol, 'usuarios.eliminar')) return { ok: false, error: MENSAJES_REGLA.sinPermiso }
  if (actor.id === objetivo.id) return { ok: false, error: MENSAJES_REGLA.propiaEliminacion }
  if (dejariaSinAdmin(objetivo, { activo: false, rol: objetivo.rol }, adminsActivos)) {
    return { ok: false, error: MENSAJES_REGLA.ultimoAdmin }
  }
  return { ok: true }
}

function dejariaSinAdmin(
  antes: Pick<Objetivo, 'rol' | 'activo'>,
  despues: { rol: Rol; activo: boolean },
  adminsActivos: number,
) {
  const eraAdminActivo = antes.rol === 'ADMIN' && antes.activo
  const siguesSiendo = despues.rol === 'ADMIN' && despues.activo
  return eraAdminActivo && !siguesSiendo && adminsActivos <= 1
}

/* -------------------------------------------------------------------------------------------- */
/* Secciones del panel                                                                          */
/* -------------------------------------------------------------------------------------------- */

export type SeccionPanel = {
  href: `/dashboard/${string}`
  titulo: string
  permiso: Permiso
}

/** Secciones del panel en el orden del sidebar. El proxy y las páginas usan el mismo permiso. */
export const SECCIONES_PANEL = [
  { href: '/dashboard/perfil', titulo: 'Perfil', permiso: 'perfil.propio' },
  { href: '/dashboard/usuarios', titulo: 'Usuarios', permiso: 'usuarios.ver' },
  { href: '/dashboard/clientes', titulo: 'Clientes', permiso: 'clientes.ver' },
  { href: '/dashboard/servicios', titulo: 'Servicios', permiso: 'servicios.ver' },
  { href: '/dashboard/recursos', titulo: 'Recursos', permiso: 'recursos.ver' },
  { href: '/dashboard/mensajes', titulo: 'Mensajes', permiso: 'mensajes.ver' },
  {
    href: '/dashboard/automatizacion',
    titulo: 'Automatización',
    permiso: 'automatizacion.ejecutar',
  },
  { href: '/dashboard/noticias', titulo: 'Noticias', permiso: 'noticias.administrar' },
  { href: '/dashboard/estado', titulo: 'Estado del sistema', permiso: 'sistema.estado' },
] as const satisfies readonly SeccionPanel[]

export function seccionesPara(rol: Rol) {
  return SECCIONES_PANEL.filter((s) => can(rol, s.permiso))
}

/** Permiso requerido para una ruta del panel (la sección más específica que la contiene). */
export function permisoDeRuta(pathname: string): Permiso | null {
  const seccion = SECCIONES_PANEL.find(
    (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
  )
  return seccion?.permiso ?? null
}
