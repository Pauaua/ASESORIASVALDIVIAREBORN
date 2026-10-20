import { expect, test } from '@playwright/test'
import { iniciarSesion } from './helpers'

test('ADMIN crea, edita y elimina recursos; el cliente los ve', async ({ page, browser }) => {
  const categoria = `E2E Guías ${Date.now()}`
  await iniciarSesion(page, 'ADMIN', '/dashboard/recursos')

  await page.getByRole('button', { name: 'Nueva categoría' }).click()
  const dialogo = page.getByRole('dialog')
  await dialogo.getByLabel('Nombre de la categoría').fill(categoria)
  await dialogo.getByLabel('Descripción (opcional)').fill('Creada por la prueba E2E')
  await dialogo.getByRole('button', { name: 'Crear' }).click()
  await expect(page.getByRole('heading', { name: categoria })).toBeVisible()

  await page.getByRole('button', { name: `Añadir a ${categoria}` }).click()
  await dialogo.getByLabel('Nombre del recurso').fill('Portal SII')
  await dialogo.getByLabel('URL').fill('javascript:alert(1)')
  await dialogo.getByRole('button', { name: 'Agregar' }).click()
  await expect(dialogo.getByText(/http:\/\/ o https:\/\//)).toBeVisible()
  await dialogo.getByLabel('URL').fill('https://www.sii.cl')
  await dialogo.getByRole('button', { name: 'Agregar' }).click()
  await expect(page.getByRole('link', { name: 'Portal SII' })).toBeVisible()

  // El cliente ve la categoría y su enlace.
  const cliente = await (await browser.newContext()).newPage()
  await iniciarSesion(cliente, 'CLIENT', '/dashboard/recursos')
  await cliente.getByRole('button', { name: new RegExp(categoria) }).click()
  await expect(
    cliente.getByRole('dialog').getByRole('link', { name: /Portal SII/ }),
  ).toHaveAttribute('href', 'https://www.sii.cl')
  await cliente.close()

  // Borrar la categoría avisa cuántos archivos se eliminan.
  await page.getByRole('button', { name: `Eliminar categoría ${categoria}` }).click()
  await expect(page.getByRole('alertdialog')).toContainText('sus 1 archivo(s)')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('heading', { name: categoria })).toHaveCount(0)
})
