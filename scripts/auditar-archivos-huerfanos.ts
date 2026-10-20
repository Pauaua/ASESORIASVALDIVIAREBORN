/**
 * Archivos de recursos ("File") sin categoría (resourceId NULL).
 *
 * En el sitio anterior la relación era ON DELETE SET NULL: al borrar una categoría, sus archivos
 * quedaban huérfanos e invisibles en el panel. Desde la migración `archivos_cascade` borrar una
 * categoría borra sus archivos, pero los huérfanos que ya existían siguen ahí: este script los
 * lista y, si se le pide, los asigna a una categoría o los elimina.
 *
 * Por defecto SOLO LEE. Para modificar hay que pasar la acción Y `--confirmar`.
 *
 * Uso:
 *   npx tsx scripts/auditar-archivos-huerfanos.ts                         # listar
 *   npx tsx scripts/auditar-archivos-huerfanos.ts --asignar 3 --confirmar # mover a la categoría 3
 *   npx tsx scripts/auditar-archivos-huerfanos.ts --eliminar --confirmar  # borrarlos
 *   (todas aceptan --url "<url>" para apuntar a otra base)
 */
import { createScriptPrisma } from './lib/prisma'

const prisma = createScriptPrisma()

function argumento(nombre: string) {
  const i = process.argv.indexOf(nombre)
  return i === -1 ? undefined : (process.argv[i + 1] ?? '')
}

async function main() {
  const asignarA = argumento('--asignar')
  const eliminar = process.argv.includes('--eliminar')
  const confirmar = process.argv.includes('--confirmar')

  const [total, huerfanos, categorias] = await Promise.all([
    prisma.resourceFile.count(),
    prisma.resourceFile.findMany({
      where: { resourceId: null },
      select: { id: true, name: true, url: true, type: true, createdAt: true },
      orderBy: { id: 'asc' },
    }),
    prisma.resource.findMany({ select: { id: true, name: true }, orderBy: { id: 'asc' } }),
  ])

  console.log(`Archivos en total: ${total}`)
  console.log(`Archivos huérfanos (sin categoría): ${huerfanos.length}`)
  for (const f of huerfanos) {
    const fecha = f.createdAt.toISOString().slice(0, 10)
    console.log(`  - id ${f.id} [${f.type ?? 'sin tipo'}] "${f.name}" → ${f.url} (${fecha})`)
  }
  console.log('\nCategorías disponibles:')
  for (const c of categorias) console.log(`  - ${c.id}: ${c.name}`)

  if (huerfanos.length === 0 || (!asignarA && !eliminar)) return
  if (asignarA && eliminar) throw new Error('Usa --asignar o --eliminar, no ambos.')

  const ids = huerfanos.map((f) => f.id)
  if (asignarA) {
    const categoriaId = Number(asignarA)
    if (!categorias.some((c) => c.id === categoriaId)) {
      throw new Error(`La categoría ${asignarA} no existe.`)
    }
    if (!confirmar) {
      console.log(
        `\n(simulación) Se asignarían ${ids.length} archivos a la categoría ${categoriaId}. Agrega --confirmar.`,
      )
      return
    }
    const r = await prisma.resourceFile.updateMany({
      where: { id: { in: ids }, resourceId: null },
      data: { resourceId: categoriaId },
    })
    console.log(`\nAsignados ${r.count} archivos a la categoría ${categoriaId}.`)
    return
  }

  if (!confirmar) {
    console.log(`\n(simulación) Se eliminarían ${ids.length} archivos. Agrega --confirmar.`)
    return
  }
  const r = await prisma.resourceFile.deleteMany({ where: { id: { in: ids }, resourceId: null } })
  console.log(`\nEliminados ${r.count} archivos huérfanos.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
