import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { attachDatabasePool } from '@vercel/functions'
import { Pool } from 'pg'
import { env } from '@/env'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * Cliente de Prisma para Vercel (serverless) + PostgreSQL en Railway.
 *
 * - Un solo Pool y un solo PrismaClient por instancia (singleton en globalThis, también
 *   sobrevive al hot reload en desarrollo).
 * - Pool pequeño (DATABASE_POOL_MAX, 5 por defecto): Railway no trae pooler y cada instancia
 *   de función abre sus propias conexiones. Si aparece "too many connections", ver
 *   docs/migracion-bd.md (PgBouncer).
 * - attachDatabasePool mantiene viva la instancia hasta cerrar las conexiones inactivas
 *   antes de que Vercel la suspenda.
 */

function createPrisma() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })
  attachDatabasePool(pool)

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? createPrisma()

globalForPrisma.prisma = db
