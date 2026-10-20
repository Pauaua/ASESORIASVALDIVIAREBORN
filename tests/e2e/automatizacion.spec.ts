import { expect, test } from '@playwright/test'
import { iniciarSesion } from './helpers'

/** Contra el mock del daemon (scripts/mock-daemon.ts), que levanta playwright.config.ts. */
test.describe('automatización SII (TEAM)', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, 'TEAM', '/dashboard/automatizacion')
    await expect(page.getByText('Daemon conectado')).toBeVisible()
  })

  test('boleta individual: valida RUT, emite y muestra el progreso', async ({ page }) => {
    await page.getByRole('button', { name: /Creación de Boletas/ }).click()
    await page.getByLabel('RUT emisor').fill('11.111.111-2')
    await page.getByLabel('Clave SII').fill('clave-de-prueba')
    await page.getByLabel('RUT destinatario').fill('22222222')
    await page.getByLabel('DV').fill('2')
    await page.getByLabel('Nombre / razón social').fill('Empresa Ejemplo')
    await page.getByLabel('Domicilio').fill('Calle 1')
    await page.getByLabel('Comuna').fill('Antofagasta')
    await page.getByRole('button', { name: 'Emitir boleta' }).click()
    await expect(page.getByText('RUT inválido (revisa el dígito verificador)')).toBeVisible()
    await expect(page.getByText('Ingresa al menos una prestación.')).toBeVisible()

    await page.getByLabel('RUT emisor').fill('11.111.111-1')
    await page.getByLabel(/^Prestación 1/).fill('Asesoría contable')
    await page.getByLabel('Valor prestación 1').fill('150000')
    await page.getByRole('button', { name: 'Emitir boleta' }).click()

    const progreso = page.getByRole('region', { name: 'Progreso del proceso' })
    await expect(progreso).toBeVisible()
    await expect(page.getByLabel('Clave SII')).toHaveValue('')
    await expect(progreso.getByRole('status')).toContainText('Completado', { timeout: 30_000 })
    await expect(page.getByLabel('Registro del proceso')).toContainText('Proceso terminado')
  })

  test('factura individual: se puede detener', async ({ page }) => {
    await page.getByRole('button', { name: /Facturas Electrónicas/ }).click()
    await page.getByLabel('RUT empresa').fill('76.000.000-0')
    await page.getByLabel('Clave SII').fill('clave-de-prueba')
    await page.getByRole('button', { name: 'Aceptar facturas' }).click()
    const progreso = page.getByRole('region', { name: 'Progreso del proceso' })
    await expect(progreso.getByRole('status')).toContainText('Procesando', { timeout: 10_000 })
    await progreso.getByRole('button', { name: 'Detener' }).click()
    await expect(progreso.getByRole('status')).toContainText('Detenido', { timeout: 10_000 })
  })

  test('facturas masivo con la plantilla de ejemplo', async ({ page }) => {
    await page.getByRole('button', { name: /Facturas Electrónicas/ }).click()
    await page.getByRole('tab', { name: 'Masivo (Excel)' }).click()
    await page
      .getByLabel('Archivo Excel')
      .setInputFiles('public/plantillas/plantilla-facturas.xlsx')
    await page.getByRole('button', { name: 'Iniciar proceso masivo' }).click()
    await expect(
      page.getByRole('region', { name: 'Progreso del proceso' }).getByRole('status'),
    ).toContainText('Completado', { timeout: 30_000 })
  })
})
