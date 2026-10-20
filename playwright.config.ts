import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas end-to-end contra la app en http://localhost:3000 (debe coincidir con AUTH_URL) y el
 * mock del daemon en http://localhost:8765, con la base LOCAL de desarrollo (Docker).
 *
 *   npm run build && npm run test:e2e      # levanta `next start` y el mock automáticamente
 *   npm run test:e2e                       # o reutiliza un `npm run dev` ya abierto
 *
 * El setup global siembra la base de desarrollo y limpia el rate limit. Nunca apuntes estas
 * pruebas a una base real: crean y borran datos.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: /publico\.spec\.ts/ },
  ],
  webServer: [
    {
      command: 'npm run start -- -p 3000',
      url: 'http://localhost:3000/robots.txt',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'npm run mock:daemon',
      url: 'http://localhost:8765/health',
      reuseExistingServer: !process.env.CI,
      env: { PORT: '8765', DAEMON_SECRET: 'dev-secret' },
    },
  ],
})
