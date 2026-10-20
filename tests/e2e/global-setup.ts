import { execSync } from 'node:child_process'
import { chromium, type FullConfig } from '@playwright/test'
import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { Client } from 'pg'
import { archivoSesion, CLAVE_DEV, CUENTAS, DIR_SESIONES } from './helpers'

/**
 * Prepara la base LOCAL: usuarios y categorías de desarrollo, noticias iniciales y rate limit en
 * cero (si no, los logins repetidos de las pruebas quedarían bloqueados).
 */
export default async function globalSetup(config: FullConfig) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL')
  const { hostname } = new URL(url)
  if (!['localhost', '127.0.0.1'].includes(hostname)) {
    throw new Error(
      `Las pruebas E2E solo corren contra una base local (DATABASE_URL apunta a ${hostname}).`,
    )
  }

  execSync('npx prisma db seed', { stdio: 'inherit' })
  execSync('npx tsx scripts/sembrar-noticias.ts', { stdio: 'inherit' })

  const db = new Client({ connectionString: url })
  await db.connect()
  await db.query('DELETE FROM "RateLimit"')
  // Restos de corridas anteriores.
  await db.query(`DELETE FROM "Resource" WHERE name LIKE 'E2E %'`)
  await db.query(`DELETE FROM "Users" WHERE email LIKE 'e2e-%@dev.local'`)
  await db.query(`UPDATE "Users" SET active = true WHERE email LIKE '%@dev.local'`)
  await db.end()

  // Calentamiento: la primera carga de cada ruta tras un build puede tardar varios segundos
  // (disco frío, antivirus); así las pruebas no fallan por eso.
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000'
  const navegador = await chromium.launch()
  const pagina = await navegador.newPage()
  for (const ruta of ['/', '/auth/login', '/contacto', '/cotiza', '/servicios', '/noticias']) {
    await pagina.goto(`${baseURL}${ruta}`, { waitUntil: 'networkidle', timeout: 120_000 })
  }

  // Una sesión por rol, reutilizada por las pruebas (el rate limit de login es de 10 por IP).
  mkdirSync(DIR_SESIONES, { recursive: true })
  for (const rol of Object.keys(CUENTAS) as (keyof typeof CUENTAS)[]) {
    const contexto = await navegador.newContext({ baseURL })
    const p = await contexto.newPage()
    await p.goto('/auth/login', { waitUntil: 'networkidle' })
    await p.getByLabel('Correo electrónico:').fill(CUENTAS[rol])
    await p.getByLabel('Contraseña:', { exact: true }).fill(CLAVE_DEV)
    await p.getByRole('button', { name: 'INICIAR SESIÓN' }).click()
    await p.waitForURL('**/dashboard/perfil', { timeout: 60_000 })
    await contexto.storageState({ path: archivoSesion(rol) })
    await contexto.close()
  }
  await navegador.close()
}
