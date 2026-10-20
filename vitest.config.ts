import { fileURLToPath } from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    env: { SKIP_ENV_VALIDATION: '1' },
  },
  resolve: {
    // `server-only` lanza fuera de un Server Component; en las pruebas no aplica.
    alias: { 'server-only': fileURLToPath(new URL('./tests/stubs/vacio.ts', import.meta.url)) },
  },
})
