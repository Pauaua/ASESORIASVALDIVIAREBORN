'use server'

import bcrypt from 'bcryptjs'
import { refresh } from 'next/cache'
import { borrarBlob } from '@/lib/blob'
import { db } from '@/lib/db'
import { conflictosUnicidad, contarAdminsActivos, obtenerUsuario } from '@/lib/data/usuarios'
import { can, isRol, puedeCambiarEstado, puedeCambiarRol, puedeEliminar } from '@/lib/rbac'
import { requirePermiso } from '@/lib/session'
import { esUrlBlob } from '@/lib/subidas'
import {
  crearUsuarioSchema,
  editarClienteAdminSchema,
  editarClienteDriveSchema,
  editarUsuarioSchema,
  idSchema,
  perfilClienteSchema,
  perfilPersonalSchema,
} from '@/lib/validators/usuarios'
import { ejecutar, exito, fallo, falloValidacion, type Resultado } from './resultado'

const COSTO_BCRYPT = 10

/* ------------------------------------------------------------------------------------------ */
/* Perfil propio                                                                               */
/* ------------------------------------------------------------------------------------------ */

/**
 * Actualiza el perfil de quien tiene la sesión. ADMIN y TEAM: datos personales. CLIENT: datos
 * personales + información comercial. `active`, `role`, `driveURL` e `image` nunca se aceptan
 * aquí (el esquema los descarta).
 */
export async function actualizarPerfil(input: unknown): Promise<Resultado> {
  return ejecutar('actualizarPerfil', async () => {
    const yo = await requirePermiso('perfil.propio')
    const esquema = can(yo.rol, 'perfil.comercial') ? perfilClienteSchema : perfilPersonalSchema
    const parsed = esquema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const { password, ...datos } = parsed.data

    const conflictos = await conflictosUnicidad(datos, yo.id)
    if (conflictos) return fallo(409, 'Revisa los campos marcados.', conflictos)

    await db.user.update({
      where: { id: yo.id },
      data: {
        ...datos,
        ...(password ? { password: await bcrypt.hash(password, COSTO_BCRYPT) } : {}),
      },
      select: { id: true },
    })
    refresh()
    return exito('Datos actualizados correctamente.')
  })
}

/** Cambia la foto de perfil propia (la URL viene de una subida directa a Vercel Blob). */
export async function actualizarFotoPerfil(url: unknown): Promise<Resultado> {
  return ejecutar('actualizarFotoPerfil', async () => {
    const yo = await requirePermiso('perfil.propio')
    if (url !== null && (typeof url !== 'string' || !esUrlBlob(url))) {
      return fallo(400, 'La imagen no es válida.')
    }
    const anterior = await db.user.findUnique({ where: { id: yo.id }, select: { image: true } })
    await db.user.update({ where: { id: yo.id }, data: { image: url }, select: { id: true } })
    if (anterior?.image && anterior.image !== url) await borrarBlob(anterior.image)
    refresh()
    return exito(url ? 'Foto actualizada.' : 'Foto eliminada.')
  })
}

/* ------------------------------------------------------------------------------------------ */
/* Administración de usuarios (solo ADMIN)                                                     */
/* ------------------------------------------------------------------------------------------ */

/** Alta de usuarios TEAM o CLIENT. Única forma de crear usuarios en el sistema. */
export async function crearUsuario(input: unknown): Promise<Resultado<{ id: number }>> {
  return ejecutar('crearUsuario', async () => {
    await requirePermiso('usuarios.crear')
    const parsed = crearUsuarioSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const { password, image, ...datos } = parsed.data
    if (image && !esUrlBlob(image)) return fallo(400, 'La imagen no es válida.')

    const conflictos = await conflictosUnicidad(datos)
    if (conflictos) return fallo(409, 'Revisa los campos marcados.', conflictos)

    const creado = await db.user.create({
      data: {
        ...datos,
        image: image ?? null,
        password: await bcrypt.hash(password, COSTO_BCRYPT),
      },
      select: { id: true },
    })
    refresh()
    return exito('Usuario creado correctamente.', { id: creado.id })
  })
}

/** Edición de otro usuario por ADMIN: datos, rol (con reglas) y reseteo de contraseña. */
export async function editarUsuario(idInput: unknown, input: unknown): Promise<Resultado> {
  return ejecutar('editarUsuario', async () => {
    const yo = await requirePermiso('usuarios.editar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Usuario inválido.')
    const parsed = editarUsuarioSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const { password, image, role, ...datos } = parsed.data
    if (image && !esUrlBlob(image)) return fallo(400, 'La imagen no es válida.')

    return db.$transaction(async (tx) => {
      const objetivo = await tx.user.findUnique({
        where: { id: id.data },
        select: { id: true, role: true, active: true, image: true },
      })
      if (!objetivo || !isRol(objetivo.role)) return fallo(404, 'El usuario no existe.')

      const regla = puedeCambiarRol(
        yo,
        { id: objetivo.id, rol: objetivo.role, activo: objetivo.active },
        role,
        await contarAdminsActivos(tx),
      )
      if (!regla.ok) return fallo(403, regla.error)

      const conflictos = await conflictosUnicidad(datos, objetivo.id)
      if (conflictos) return fallo(409, 'Revisa los campos marcados.', conflictos)

      const esCliente = role === 'CLIENT'
      await tx.user.update({
        where: { id: objetivo.id },
        data: {
          ...datos,
          role,
          image: image ?? null,
          // Los datos comerciales y el Drive solo tienen sentido para clientes.
          ...(esCliente
            ? {}
            : {
                company: null,
                companyEmail: null,
                companyPhone: null,
                companyRUT: null,
                driveURL: null,
              }),
          ...(password ? { password: await bcrypt.hash(password, COSTO_BCRYPT) } : {}),
        },
        select: { id: true },
      })
      if (objetivo.image && objetivo.image !== image) await borrarBlob(objetivo.image)
      refresh()
      return exito(
        password ? 'Usuario actualizado y contraseña restablecida.' : 'Usuario actualizado.',
      )
    })
  })
}

/**
 * Activa o desactiva a OTRO usuario (solo ADMIN). Nadie cambia su propio estado y nunca queda el
 * sistema sin un ADMIN activo. La sesión del desactivado se corta en ≤ 60 s (callback jwt).
 */
export async function cambiarEstadoUsuario(
  idInput: unknown,
  activoInput: unknown,
): Promise<Resultado> {
  return ejecutar('cambiarEstadoUsuario', async () => {
    const yo = await requirePermiso('usuarios.activar')
    const id = idSchema.safeParse(idInput)
    if (!id.success || typeof activoInput !== 'boolean') return fallo(400, 'Datos inválidos.')
    const activo = activoInput

    return db.$transaction(async (tx) => {
      const objetivo = await tx.user.findUnique({
        where: { id: id.data },
        select: { id: true, role: true, active: true },
      })
      if (!objetivo || !isRol(objetivo.role)) return fallo(404, 'El usuario no existe.')

      const regla = puedeCambiarEstado(
        yo,
        { id: objetivo.id, rol: objetivo.role, activo: objetivo.active },
        activo,
        await contarAdminsActivos(tx),
      )
      if (!regla.ok) return fallo(403, regla.error)

      await tx.user.update({
        where: { id: objetivo.id },
        data: { active: activo },
        select: { id: true },
      })
      refresh()
      return exito(activo ? 'Usuario activado.' : 'Usuario desactivado.')
    })
  })
}

/**
 * Borrado físico (solo ADMIN, doble confirmación: hay que escribir el correo del usuario).
 * El borrado habitual es lógico: desactivar.
 */
export async function eliminarUsuario(idInput: unknown, confirmacion: unknown): Promise<Resultado> {
  return ejecutar('eliminarUsuario', async () => {
    const yo = await requirePermiso('usuarios.eliminar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Usuario inválido.')

    return db.$transaction(async (tx) => {
      const objetivo = await tx.user.findUnique({
        where: { id: id.data },
        select: { id: true, role: true, active: true, email: true, image: true },
      })
      if (!objetivo || !isRol(objetivo.role)) return fallo(404, 'El usuario no existe.')

      const regla = puedeEliminar(
        yo,
        { id: objetivo.id, rol: objetivo.role, activo: objetivo.active },
        await contarAdminsActivos(tx),
      )
      if (!regla.ok) return fallo(403, regla.error)
      if (
        typeof confirmacion !== 'string' ||
        confirmacion.trim().toLowerCase() !== objetivo.email.toLowerCase()
      ) {
        return fallo(400, 'Escribe el correo del usuario para confirmar la eliminación.')
      }

      await tx.user.delete({ where: { id: objetivo.id } })
      await borrarBlob(objetivo.image)
      refresh()
      return exito('Usuario eliminado definitivamente.')
    })
  })
}

/* ------------------------------------------------------------------------------------------ */
/* Clientes                                                                                    */
/* ------------------------------------------------------------------------------------------ */

/** Edición de un cliente: ADMIN edita datos comerciales y Drive; TEAM solo el link de Drive. */
export async function editarCliente(idInput: unknown, input: unknown): Promise<Resultado> {
  return ejecutar('editarCliente', async () => {
    const yo = await requirePermiso('clientes.editarDrive')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Cliente inválido.')

    const esquema = can(yo.rol, 'clientes.editarComercial')
      ? editarClienteAdminSchema
      : editarClienteDriveSchema
    const parsed = esquema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)

    const cliente = await db.user.findUnique({ where: { id: id.data }, select: { role: true } })
    if (cliente?.role !== 'CLIENT') return fallo(404, 'El cliente no existe.')

    await db.user.update({ where: { id: id.data }, data: parsed.data, select: { id: true } })
    refresh()
    return exito('Cliente actualizado.')
  })
}

/** Datos de un usuario para formularios del panel (sin campos sensibles). */
export async function leerUsuario(idInput: unknown) {
  return ejecutar('leerUsuario', async () => {
    await requirePermiso('usuarios.ver')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Usuario inválido.')
    const usuario = await obtenerUsuario(id.data)
    if (!usuario) return fallo(404, 'El usuario no existe.')
    return exito(undefined, usuario)
  })
}
