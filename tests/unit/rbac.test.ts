import { describe, expect, it } from 'vitest'
import {
  can,
  MENSAJES_REGLA,
  PERMISOS,
  permisoDeRuta,
  puedeCambiarEstado,
  puedeCambiarRol,
  puedeEliminar,
  ROLES,
  seccionesPara,
  type Permiso,
  type Rol,
} from '@/lib/rbac'

/**
 * Matriz de la especificación, escrita a mano a propósito: si alguien cambia PERMISOS sin
 * actualizar esta tabla, la prueba falla.
 */
const MATRIZ: Record<Permiso, Record<Rol, boolean>> = {
  'perfil.propio': { ADMIN: true, TEAM: true, CLIENT: true },
  'perfil.comercial': { ADMIN: false, TEAM: false, CLIENT: true },
  'usuarios.ver': { ADMIN: true, TEAM: false, CLIENT: false },
  'usuarios.crear': { ADMIN: true, TEAM: false, CLIENT: false },
  'usuarios.editar': { ADMIN: true, TEAM: false, CLIENT: false },
  'usuarios.activar': { ADMIN: true, TEAM: false, CLIENT: false },
  'usuarios.eliminar': { ADMIN: true, TEAM: false, CLIENT: false },
  'clientes.ver': { ADMIN: true, TEAM: true, CLIENT: false },
  'clientes.editarDrive': { ADMIN: true, TEAM: true, CLIENT: false },
  'clientes.editarComercial': { ADMIN: true, TEAM: false, CLIENT: false },
  'recursos.ver': { ADMIN: true, TEAM: true, CLIENT: true },
  'recursos.administrar': { ADMIN: true, TEAM: false, CLIENT: false },
  'servicios.ver': { ADMIN: true, TEAM: false, CLIENT: false },
  'mensajes.ver': { ADMIN: true, TEAM: true, CLIENT: false },
  'mensajes.marcarLeido': { ADMIN: true, TEAM: true, CLIENT: false },
  'mensajes.eliminar': { ADMIN: true, TEAM: false, CLIENT: false },
  'mensajes.exportar': { ADMIN: true, TEAM: false, CLIENT: false },
  'mensajes.crearUsuario': { ADMIN: true, TEAM: false, CLIENT: false },
  'automatizacion.ejecutar': { ADMIN: true, TEAM: true, CLIENT: false },
  'noticias.administrar': { ADMIN: true, TEAM: false, CLIENT: false },
  'sistema.estado': { ADMIN: true, TEAM: false, CLIENT: false },
}

describe('matriz de permisos', () => {
  it('cubre exactamente los permisos definidos', () => {
    expect(Object.keys(MATRIZ).sort()).toEqual(Object.keys(PERMISOS).sort())
  })

  for (const [permiso, porRol] of Object.entries(MATRIZ) as [Permiso, Record<Rol, boolean>][]) {
    for (const rol of ROLES) {
      it(`${rol} ${porRol[rol] ? 'puede' : 'NO puede'} ${permiso}`, () => {
        expect(can(rol, permiso)).toBe(porRol[rol])
      })
    }
  }

  it('sin rol no hay permisos', () => {
    for (const permiso of Object.keys(PERMISOS) as Permiso[]) {
      expect(can(null, permiso)).toBe(false)
      expect(can(undefined, permiso)).toBe(false)
    }
  })
})

const admin = { id: 1, rol: 'ADMIN' as const }
const team = { id: 2, rol: 'TEAM' as const }
const cliente = { id: 3, rol: 'CLIENT' as const }

describe('activar / desactivar', () => {
  it('ADMIN desactiva a otro usuario', () => {
    expect(puedeCambiarEstado(admin, { id: 3, rol: 'CLIENT', activo: true }, false, 1)).toEqual({
      ok: true,
    })
  })

  it('nadie cambia su propio estado, ni siquiera ADMIN', () => {
    expect(puedeCambiarEstado(admin, { ...admin, activo: true }, false, 2)).toEqual({
      ok: false,
      error: MENSAJES_REGLA.propioEstado,
    })
    for (const actor of [team, cliente]) {
      expect(puedeCambiarEstado(actor, { ...actor, activo: true }, false, 2).ok).toBe(false)
    }
  })

  it('TEAM y CLIENT no cambian el estado de otros', () => {
    for (const actor of [team, cliente]) {
      expect(puedeCambiarEstado(actor, { id: 9, rol: 'CLIENT', activo: true }, false, 1)).toEqual({
        ok: false,
        error: MENSAJES_REGLA.sinPermiso,
      })
    }
  })

  it('no se desactiva al último ADMIN activo', () => {
    expect(puedeCambiarEstado(admin, { id: 5, rol: 'ADMIN', activo: true }, false, 1)).toEqual({
      ok: false,
      error: MENSAJES_REGLA.ultimoAdmin,
    })
    expect(puedeCambiarEstado(admin, { id: 5, rol: 'ADMIN', activo: true }, false, 2).ok).toBe(true)
  })

  it('reactivar a un ADMIN inactivo siempre se permite', () => {
    expect(puedeCambiarEstado(admin, { id: 5, rol: 'ADMIN', activo: false }, true, 1).ok).toBe(true)
  })
})

describe('cambio de rol', () => {
  it('nadie cambia su propio rol', () => {
    expect(puedeCambiarRol(admin, { ...admin, activo: true }, 'TEAM', 3)).toEqual({
      ok: false,
      error: MENSAJES_REGLA.propioRol,
    })
  })

  it('mantener el mismo rol no es un cambio', () => {
    expect(puedeCambiarRol(admin, { ...admin, activo: true }, 'ADMIN', 1).ok).toBe(true)
  })

  it('no se asciende a ADMIN desde el panel', () => {
    expect(puedeCambiarRol(admin, { id: 3, rol: 'CLIENT', activo: true }, 'ADMIN', 1)).toEqual({
      ok: false,
      error: MENSAJES_REGLA.rolNoAsignable,
    })
  })

  it('no se degrada al último ADMIN activo', () => {
    expect(puedeCambiarRol(admin, { id: 5, rol: 'ADMIN', activo: true }, 'TEAM', 1)).toEqual({
      ok: false,
      error: MENSAJES_REGLA.ultimoAdmin,
    })
    expect(puedeCambiarRol(admin, { id: 5, rol: 'ADMIN', activo: true }, 'TEAM', 2).ok).toBe(true)
  })

  it('TEAM no cambia roles', () => {
    expect(puedeCambiarRol(team, { id: 3, rol: 'CLIENT', activo: true }, 'TEAM', 1).ok).toBe(false)
  })
})

describe('eliminación', () => {
  it('nadie se elimina a sí mismo', () => {
    expect(puedeEliminar(admin, { ...admin, activo: true }, 3)).toEqual({
      ok: false,
      error: MENSAJES_REGLA.propiaEliminacion,
    })
  })

  it('no se elimina al último ADMIN activo', () => {
    expect(puedeEliminar(admin, { id: 5, rol: 'ADMIN', activo: true }, 1).ok).toBe(false)
  })

  it('solo ADMIN elimina', () => {
    expect(puedeEliminar(team, { id: 3, rol: 'CLIENT', activo: true }, 1).ok).toBe(false)
    expect(puedeEliminar(admin, { id: 3, rol: 'CLIENT', activo: true }, 1).ok).toBe(true)
  })
})

describe('secciones del panel', () => {
  const secciones = (rol: Rol) => seccionesPara(rol).map((s) => s.href.replace('/dashboard/', ''))

  it('cada rol ve sus secciones', () => {
    expect(secciones('ADMIN')).toEqual([
      'perfil',
      'usuarios',
      'clientes',
      'servicios',
      'recursos',
      'mensajes',
      'automatizacion',
      'noticias',
      'estado',
    ])
    expect(secciones('TEAM')).toEqual([
      'perfil',
      'clientes',
      'recursos',
      'mensajes',
      'automatizacion',
    ])
    expect(secciones('CLIENT')).toEqual(['perfil', 'recursos'])
  })

  it('las subrutas heredan el permiso de su sección', () => {
    expect(permisoDeRuta('/dashboard/usuarios/nuevo')).toBe('usuarios.ver')
    expect(permisoDeRuta('/dashboard/usuariosx')).toBeNull()
    expect(permisoDeRuta('/dashboard/automatizacion')).toBe('automatizacion.ejecutar')
  })
})
