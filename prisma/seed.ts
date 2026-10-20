/**
 * Seed SOLO para desarrollo: un ADMIN, un TEAM, un CLIENT (con carpeta de Drive) y
 * 2 categorías de recursos. Es idempotente (upsert).
 *
 * Uso: npm run db:seed
 *
 * Se niega a correr contra una base que no sea local, para no tocar producción por error.
 * Las noticias se cargan aparte con `npm run noticias:sembrar` (sirve también en producción).
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('Falta DATABASE_URL')

const host = new URL(databaseUrl).hostname
if (!['localhost', '127.0.0.1', 'db'].includes(host) || process.env.NODE_ENV === 'production') {
  throw new Error(`Seed bloqueado: la base "${host}" no es local. El seed es solo para desarrollo.`)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

/** Contraseña común de los usuarios de desarrollo. */
const DEV_PASSWORD = 'Desarrollo.2026'

async function main() {
  const password = await hash(DEV_PASSWORD, 10)

  const users = [
    {
      email: 'admin@dev.local',
      username: 'admin',
      name: 'Ana',
      lastname: 'Administradora',
      role: 'ADMIN' as const,
    },
    {
      email: 'equipo@dev.local',
      username: 'equipo',
      name: 'Tomás',
      lastname: 'Equipo',
      role: 'TEAM' as const,
    },
    {
      email: 'cliente@dev.local',
      username: 'cliente',
      name: 'Carla',
      lastname: 'Cliente',
      role: 'CLIENT' as const,
      company: 'Comercial Ejemplo SpA',
      companyEmail: 'facturacion@ejemplo.cl',
      companyPhone: '552000000',
      companyRUT: '76123456-0',
      driveURL: 'https://drive.google.com/drive/folders/ejemplo-desarrollo',
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password, phone: '912345678' },
    })
  }

  const categories = [
    {
      name: 'Guías tributarias',
      description: 'Material de apoyo sobre obligaciones con el SII.',
      files: [
        { name: 'Portal del SII', url: 'https://www.sii.cl', type: 'link' },
        { name: 'Calendario tributario', url: 'https://www.sii.cl/calendario/', type: 'link' },
      ],
    },
    {
      name: 'Recursos laborales',
      description: 'Enlaces útiles de la Dirección del Trabajo.',
      files: [{ name: 'Dirección del Trabajo', url: 'https://www.dt.gob.cl', type: 'link' }],
    },
  ]

  for (const category of categories) {
    const exists = await prisma.resource.findFirst({ where: { name: category.name } })
    if (exists) continue
    await prisma.resource.create({
      data: {
        name: category.name,
        description: category.description,
        files: { create: category.files },
      },
    })
  }

  console.log('Seed de desarrollo listo.')
  console.log(`Usuarios: ${users.map((u) => `${u.email} (${u.role})`).join(', ')}`)
  console.log(`Contraseña de todos: ${DEV_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
