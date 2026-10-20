'use server'

import { refresh } from 'next/cache'
import { borrarBlob } from '@/lib/blob'
import { db } from '@/lib/db'
import { requirePermiso } from '@/lib/session'
import { archivoSchema, categoriaSchema } from '@/lib/validators/recursos'
import { idSchema } from '@/lib/validators/usuarios'
import { ejecutar, exito, fallo, falloValidacion, type Resultado } from './resultado'

/* Todas las mutaciones de recursos son solo para ADMIN ('recursos.administrar'). */

export async function crearCategoria(input: unknown): Promise<Resultado<{ id: number }>> {
  return ejecutar('crearCategoria', async () => {
    await requirePermiso('recursos.administrar')
    const parsed = categoriaSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const creada = await db.resource.create({ data: parsed.data, select: { id: true } })
    refresh()
    return exito('Categoría creada.', { id: creada.id })
  })
}

export async function editarCategoria(idInput: unknown, input: unknown): Promise<Resultado> {
  return ejecutar('editarCategoria', async () => {
    await requirePermiso('recursos.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Categoría inválida.')
    const parsed = categoriaSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const r = await db.resource.updateMany({ where: { id: id.data }, data: parsed.data })
    if (r.count === 0) return fallo(404, 'La categoría no existe.')
    refresh()
    return exito('Categoría actualizada.')
  })
}

/** Borra la categoría y, en cascada, sus archivos (y los PDF subidos a Blob). */
export async function eliminarCategoria(idInput: unknown): Promise<Resultado> {
  return ejecutar('eliminarCategoria', async () => {
    await requirePermiso('recursos.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Categoría inválida.')
    const categoria = await db.resource.findUnique({
      where: { id: id.data },
      select: { files: { select: { url: true } } },
    })
    if (!categoria) return fallo(404, 'La categoría no existe.')

    await db.resource.delete({ where: { id: id.data } })
    await Promise.all(categoria.files.map((f) => borrarBlob(f.url)))
    refresh()
    const n = categoria.files.length
    return exito(n ? `Categoría y ${n} archivo(s) eliminados.` : 'Categoría eliminada.')
  })
}

export async function crearArchivo(input: unknown): Promise<Resultado> {
  return ejecutar('crearArchivo', async () => {
    await requirePermiso('recursos.administrar')
    const parsed = archivoSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)
    const existe = await db.resource.count({ where: { id: parsed.data.resourceId } })
    if (!existe) return fallo(404, 'La categoría no existe.')
    await db.resourceFile.create({ data: parsed.data, select: { id: true } })
    refresh()
    return exito('Recurso agregado.')
  })
}

export async function editarArchivo(idInput: unknown, input: unknown): Promise<Resultado> {
  return ejecutar('editarArchivo', async () => {
    await requirePermiso('recursos.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Archivo inválido.')
    const parsed = archivoSchema.safeParse(input)
    if (!parsed.success) return falloValidacion(parsed.error)

    const anterior = await db.resourceFile.findUnique({
      where: { id: id.data },
      select: { url: true },
    })
    if (!anterior) return fallo(404, 'El archivo no existe.')
    const existe = await db.resource.count({ where: { id: parsed.data.resourceId } })
    if (!existe) return fallo(404, 'La categoría no existe.')

    await db.resourceFile.update({
      where: { id: id.data },
      data: parsed.data,
      select: { id: true },
    })
    if (anterior.url !== parsed.data.url) await borrarBlob(anterior.url)
    refresh()
    return exito('Archivo actualizado.')
  })
}

export async function eliminarArchivo(idInput: unknown): Promise<Resultado> {
  return ejecutar('eliminarArchivo', async () => {
    await requirePermiso('recursos.administrar')
    const id = idSchema.safeParse(idInput)
    if (!id.success) return fallo(400, 'Archivo inválido.')
    const archivo = await db.resourceFile.findUnique({
      where: { id: id.data },
      select: { url: true },
    })
    if (!archivo) return fallo(404, 'El archivo no existe.')
    await db.resourceFile.delete({ where: { id: id.data } })
    await borrarBlob(archivo.url)
    refresh()
    return exito('Archivo eliminado.')
  })
}
