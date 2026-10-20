import { expect, test } from '@playwright/test'
import { CLAVE_DEV, CUENTAS, iniciarSesion } from './helpers'

test.describe('autenticación y roles', () => {
  test('credenciales incorrectas no revelan si el correo existe', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' })
    await page.getByLabel('Correo electrónico:').fill(CUENTAS.ADMIN)
    await page.getByLabel('Contraseña:', { exact: true }).fill('incorrecta')
    await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click()
    await expect(page.getByRole('alert').filter({ hasText: /incorrectos/ })).toHaveText(
      'Correo o contraseña incorrectos.',
    )
  })

  test('login por formulario lleva al perfil (y vuelve al destino pedido)', async ({ page }) => {
    await page.goto('/dashboard/recursos', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fdashboard%2Frecursos/)
    await page.getByLabel('Correo electrónico:').fill(CUENTAS.TEAM)
    await page.getByLabel('Contraseña:', { exact: true }).fill(CLAVE_DEV)
    await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click()
    await expect(page).toHaveURL('/dashboard/recursos')
  })

  test('mostrar / ocultar contraseña', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' })
    const clave = page.getByLabel('Contraseña:', { exact: true })
    await expect(clave).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
    await expect(clave).toHaveAttribute('type', 'text')
  })

  test('ADMIN ve todas las secciones y puede cerrar sesión', async ({ page }) => {
    await iniciarSesion(page, 'ADMIN')
    const panel = page.getByRole('navigation', { name: 'Panel' })
    for (const s of [
      'Perfil',
      'Usuarios',
      'Clientes',
      'Servicios',
      'Recursos',
      'Mensajes',
      'Automatización',
      'Noticias',
      'Estado del sistema',
    ]) {
      await expect(panel.getByRole('link', { name: new RegExp(s) })).toBeVisible()
    }
    await panel.getByRole('link', { name: /Usuarios/ }).click()
    // Su propio switch de estado está deshabilitado.
    await expect(page.getByRole('switch', { name: /Ana Administradora/ })).toBeDisabled()
    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click()
    await expect(page).toHaveURL('/')
  })

  test('CLIENT solo ve perfil y recursos; el resto es /unauthorized', async ({ page }) => {
    await iniciarSesion(page, 'CLIENT')
    const panel = page.getByRole('navigation', { name: 'Panel' })
    await expect(panel.getByRole('link')).toHaveText([/Perfil/, /Recursos/])
    for (const ruta of [
      '/dashboard/usuarios',
      '/dashboard/automatizacion',
      '/dashboard/mensajes',
    ]) {
      await page.goto(ruta)
      await expect(page).toHaveURL('/unauthorized')
    }
    await page.goto('/dashboard/recursos')
    await expect(page.getByRole('button', { name: /BIBLIOTECA DIGITAL/ })).toBeVisible()
  })

  test('CLIENT guarda su información comercial', async ({ page }) => {
    await iniciarSesion(page, 'CLIENT', '/dashboard/perfil')
    const rut = page.getByLabel('RUT empresa')
    await rut.fill('12.345.678-9')
    await page.getByRole('main').getByRole('button', { name: 'Actualizar datos' }).click()
    await expect(page.getByText('RUT inválido (revisa el dígito verificador)')).toBeVisible()
    await rut.fill('76.123.456-0')
    await page.getByRole('main').getByRole('button', { name: 'Actualizar datos' }).click()
    await expect(page.getByText('Datos actualizados correctamente.')).toBeVisible()
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByLabel('RUT empresa')).toHaveValue('76.123.456-0')
  })

  test('TEAM no tiene acceso a usuarios y la API de automatización le responde', async ({
    page,
  }) => {
    await iniciarSesion(page, 'TEAM')
    await page.goto('/dashboard/usuarios')
    await expect(page).toHaveURL('/unauthorized')
    const status = await page.evaluate(
      async () => (await fetch('/api/automation?action=health')).status,
    )
    expect(status).toBe(200)
  })
})
