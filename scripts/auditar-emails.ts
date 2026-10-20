/**
 * Audita los emails de "Users" antes de normalizarlos a minúsculas.
 *
 * El sitio anterior guardaba algunos emails tal cual se escribieron (con mayúsculas), mientras
 * que el login nuevo compara en minúsculas. Este script:
 *
 *   1. Lista los emails que tienen mayúsculas o espacios.
 *   2. Detecta COLISIONES: emails distintos que serían iguales al pasarlos a minúsculas
 *      (violarían el índice único "Users_email_key").
 *
 * Por defecto SOLO LEE. Con --apply normaliza (trim + minúsculas) los emails afectados, pero
 * se niega si hay alguna colisión: esas deben resolverse a mano primero.
 *
 * Uso:
 *   npx tsx scripts/auditar-emails.ts                 # solo reporte (DATABASE_URL)
 *   npx tsx scripts/auditar-emails.ts --url "<url>"   # otra base
 *   npx tsx scripts/auditar-emails.ts --apply         # normalizar (si no hay colisiones)
 */
import { createScriptPrisma } from './lib/prisma'

const apply = process.argv.includes('--apply')
const prisma = createScriptPrisma()

const normalize = (email: string) => email.trim().toLowerCase()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, active: true },
    orderBy: { id: 'asc' },
  })

  const notNormalized = users.filter((user) => user.email !== normalize(user.email))

  const groups = new Map<string, typeof users>()
  for (const user of users) {
    const key = normalize(user.email)
    groups.set(key, [...(groups.get(key) ?? []), user])
  }
  const collisions = [...groups.entries()].filter(([, group]) => group.length > 1)

  console.log(`Usuarios: ${users.length}`)
  console.log(`Emails con mayúsculas o espacios: ${notNormalized.length}`)
  for (const user of notNormalized) {
    console.log(
      `  - id ${user.id} (${user.role}${user.active ? '' : ', inactivo'}): "${user.email}"`,
    )
  }

  console.log(`\nColisiones al pasar a minúsculas: ${collisions.length}`)
  for (const [email, group] of collisions) {
    console.log(`  - ${email}: ${group.map((u) => `id ${u.id} "${u.email}"`).join(', ')}`)
  }

  if (!apply) {
    console.log('\nSolo lectura. Usa --apply para normalizar.')
    return
  }

  if (collisions.length > 0) {
    process.exitCode = 1
    console.error('\n✖ Hay colisiones: resuélvelas a mano antes de normalizar. No se cambió nada.')
    return
  }

  await prisma.$transaction(
    notNormalized.map((user) =>
      prisma.user.update({ where: { id: user.id }, data: { email: normalize(user.email) } }),
    ),
  )
  console.log(`\n✔ Normalizados ${notNormalized.length} emails.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
