import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'

/** Contraseña de los usuarios de prisma/seed.ts (solo desarrollo). */
export const CLAVE_DEV = 'Desarrollo.2026'

export const CUENTAS = {
  ADMIN: 'admin@dev.local',
  TEAM: 'equipo@dev.local',
  CLIENT: 'cliente@dev.local',
} as const

export type RolPrueba = keyof typeof CUENTAS

export const DIR_SESIONES = join(process.cwd(), 'playwright', '.auth')
export const archivoSesion = (rol: RolPrueba) => join(DIR_SESIONES, `${rol}.json`)

/**
 * Entra al panel con la sesión de `rol` guardada en el setup global (sin pasar por el
 * formulario: el rate limit de login permite solo 10 intentos por IP cada 15 minutos).
 */
export async function iniciarSesion(page: Page, rol: RolPrueba, destino = '/dashboard/perfil') {
  const { cookies } = JSON.parse(readFileSync(archivoSesion(rol), 'utf8'))
  await page.context().addCookies(cookies)
  await page.goto(destino, { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(new RegExp(destino.replace(/[?]/g, '\?')))
}

/** El botón de envío del contenido principal (la navbar también tiene un form de logout). */
export function enviar(page: Page, nombre: string | RegExp) {
  return page.getByRole('main').getByRole('button', { name: nombre })
}
