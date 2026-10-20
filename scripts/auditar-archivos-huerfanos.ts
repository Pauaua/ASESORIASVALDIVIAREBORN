/**
 * Lista los archivos de recursos ("File") sin categoría (resourceId NULL).
 *
 * Hoy la relación es ON DELETE SET NULL: al borrar una categoría, sus archivos quedaron
 * huérfanos e invisibles en el panel. Antes de cambiar a ON DELETE CASCADE (fase 4) hay que
 * decidir qué hacer con ellos (asignarlos a una categoría o eliminarlos).
 *
 * SOLO LEE: no modifica nada. La acción sobre los huérfanos se hace en la fase 4, con
 * confirmación de la dueña del sitio.
 *
 * Uso:
 *   npx tsx scripts/auditar-archivos-huerfanos.ts
 *   npx tsx scripts/auditar-archivos-huerfanos.ts --url "<url>"
 */
import { createScriptPrisma } from './lib/prisma'

const prisma = createScriptPrisma()

async function main() {
  const [total, orphans] = await Promise.all([
    prisma.resourceFile.count(),
    prisma.resourceFile.findMany({
      where: { resourceId: null },
      select: { id: true, name: true, url: true, type: true, createdAt: true },
      orderBy: { id: 'asc' },
    }),
  ])

  console.log(`Archivos en total: ${total}`)
  console.log(`Archivos huérfanos (sin categoría): ${orphans.length}`)
  for (const file of orphans) {
    console.log(
      `  - id ${file.id} [${file.type ?? 'sin tipo'}] "${file.name}" → ${file.url} (${file.createdAt.toISOString().slice(0, 10)})`,
    )
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
