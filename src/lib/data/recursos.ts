import 'server-only'
import { db } from '@/lib/db'

/** Categorías con sus archivos (los huérfanos, sin categoría, no se muestran). */
export function listarCategorias() {
  return db.resource.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      files: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, url: true, type: true },
      },
    },
  })
}

export type CategoriaDTO = Awaited<ReturnType<typeof listarCategorias>>[number]
