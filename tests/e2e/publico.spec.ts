import { expect, test } from '@playwright/test'

/** Todas las URLs públicas del sitio anterior deben seguir respondiendo (SEO). */
const RUTAS = [
  '/',
  '/nosotros',
  '/servicios',
  '/noticias',
  '/contacto',
  '/cotiza',
  '/solicitude',
  '/misionvision',
  '/privacidad',
  '/terminosdeuso',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
]

test.describe('sitio público', () => {
  for (const ruta of RUTAS) {
    test(`${ruta} responde 200 con un h1`, async ({ page }) => {
      const res = await page.goto(ruta)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }

  test('/dashboard sin sesión lleva al login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/)
  })

  test('/auth/register redirige (301) al alta del panel', async ({ request }) => {
    const res = await request.get('/auth/register', { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers().location).toBe('/dashboard/usuarios/nuevo')
  })

  test('cabeceras de seguridad', async ({ request }) => {
    const h = (await request.get('/')).headers()
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['x-powered-by']).toBeUndefined()
  })

  test('menú móvil abre y cierra', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo en móvil')
    await page.goto('/', { waitUntil: 'networkidle' })
    const boton = page.getByRole('button', { name: 'Abrir menú' })
    await boton.click()
    await expect(page.getByRole('link', { name: 'Servicios' }).first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

test.describe('formularios públicos', () => {
  test.skip(({ isMobile }) => isMobile, 'una vez basta')

  test('contacto: valida y envía', async ({ page }) => {
    await page.goto('/contacto', { waitUntil: 'networkidle' })
    await page
      .getByRole('main')
      .getByRole('button', { name: /enviar/i })
      .click()
    await expect(page.getByText('Este campo es requerido').first()).toBeVisible()

    await page.locator('#nombre').fill('Prueba')
    await page.locator('#apellido').fill('E2E')
    await page.locator('#correo').fill('e2e@example.com')
    await page.locator('#telefono').fill('912345678')
    await page.locator('#mensaje').fill('Mensaje automático de prueba')
    // El servidor descarta envíos hechos en menos de 3 s (anti-bots).
    await page.waitForTimeout(3200)
    await page
      .getByRole('main')
      .getByRole('button', { name: /enviar/i })
      .click()
    await expect(page.getByRole('status')).toContainText('Formulario enviado con éxito')
  })

  test('cotiza: exige servicio', async ({ page }) => {
    await page.goto('/cotiza', { waitUntil: 'networkidle' })
    await page.locator('#nombre').fill('Prueba')
    await page.locator('#apellido').fill('E2E')
    await page.locator('#correo').fill('e2e@example.com')
    await page.locator('#mensaje').fill('Quiero cotizar')
    await page.waitForTimeout(3200)
    await page
      .getByRole('main')
      .getByRole('button', { name: /enviar/i })
      .click()
    await expect(page.getByText('Este campo es requerido')).toBeVisible()
    await page.locator('#servicio').selectOption('tributaria')
    await page
      .getByRole('main')
      .getByRole('button', { name: /enviar/i })
      .click()
    await expect(page.getByRole('status')).toContainText('Formulario enviado con éxito')
  })
})
