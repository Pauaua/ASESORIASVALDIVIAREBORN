import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { iniciarSesion } from './helpers'

/** Revisión automática (axe, WCAG 2.1 A/AA) de las pantallas principales del panel. */
const PANTALLAS = [
  '/dashboard/perfil',
  '/dashboard/usuarios',
  '/dashboard/usuarios/nuevo',
  '/dashboard/clientes',
  '/dashboard/recursos',
  '/dashboard/mensajes',
  '/dashboard/automatizacion',
  '/dashboard/noticias',
  '/dashboard/noticias/nueva',
  '/dashboard/estado',
]

test('panel ADMIN sin violaciones de accesibilidad', async ({ page }) => {
  await iniciarSesion(page, 'ADMIN')
  for (const ruta of PANTALLAS) {
    await page.goto(ruta)
    await expect(page.locator('main h1')).toBeVisible()
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(
      violations.map((v) => `${ruta}: ${v.id} (${v.nodes.length}) ${v.help}`),
      `violaciones en ${ruta}`,
    ).toEqual([])
  }
})

test('panel CLIENT sin violaciones de accesibilidad', async ({ page }) => {
  await iniciarSesion(page, 'CLIENT')
  for (const ruta of ['/dashboard/perfil', '/dashboard/recursos']) {
    await page.goto(ruta)
    await expect(page.locator('main h1')).toBeVisible()
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(violations.map((v) => `${ruta}: ${v.id} ${v.help}`)).toEqual([])
  }
})
