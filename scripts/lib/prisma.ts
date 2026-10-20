/**
 * Cliente de Prisma para scripts de línea de comandos (fuera de Next.js).
 * Usa DATABASE_URL, o la URL pasada con --url para apuntar a otra base explícitamente.
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../src/generated/prisma/client'

export function createScriptPrisma(argv = process.argv.slice(2)) {
  const urlIndex = argv.indexOf('--url')
  const connectionString = urlIndex >= 0 ? argv[urlIndex + 1] : process.env.DATABASE_URL
  if (!connectionString) throw new Error('Falta DATABASE_URL (o --url <conexión>)')

  const { hostname, pathname } = new URL(connectionString)
  console.log(`Base de datos: ${hostname}${pathname}\n`)

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}
