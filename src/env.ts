import { z } from 'zod'

/**
 * Variables de entorno validadas al arrancar (se importa desde next.config.ts).
 *
 * - Obligatorias: sin ellas el sitio no funciona.
 * - Opcionales: habilitan una funcionalidad (correo, Blob, daemon, cron). Si faltan, esa
 *   funcionalidad se degrada de forma controlada y el ADMIN lo ve en "Estado del sistema".
 *
 * Documentación de cada variable en `.env.example`.
 */

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional()

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET debe tener al menos 32 caracteres'),
  AUTH_URL: z.url().optional(),

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  EMAIL_TO: z
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),

  BLOB_READ_WRITE_TOKEN: optionalString,

  DAEMON_URL: z
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  DAEMON_SECRET: optionalString,

  CRON_SECRET: optionalString,

  TURNSTILE_SECRET_KEY: optionalString,
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
})

// Las NEXT_PUBLIC_* deben leerse de forma literal para que Next las inserte en el bundle.
const clientValues = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
}

const skipValidation = process.env.SKIP_ENV_VALIDATION === '1'
const isServer = typeof window === 'undefined'

function formatIssues(error: z.ZodError) {
  return error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
}

function parseServer() {
  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${formatIssues(result.error)}`)
  }
  return result.data
}

function parseClient() {
  const result = clientSchema.safeParse(clientValues)
  if (!result.success) {
    throw new Error(`Variables de entorno públicas inválidas:\n${formatIssues(result.error)}`)
  }
  return result.data
}

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>

const clientEnv: ClientEnv = skipValidation ? (clientValues as ClientEnv) : parseClient()

const serverEnv: ServerEnv | undefined = !isServer
  ? undefined
  : skipValidation
    ? (process.env as unknown as ServerEnv)
    : parseServer()

/**
 * Acceso tipado a las variables. En el navegador solo existen las NEXT_PUBLIC_*;
 * leer una variable de servidor desde el cliente lanza un error explícito.
 */
export const env = new Proxy({ ...clientEnv } as ServerEnv & ClientEnv, {
  get(target, prop: string) {
    if (prop in clientEnv) return clientEnv[prop as keyof ClientEnv]
    if (!serverEnv) {
      throw new Error(`La variable "${prop}" solo está disponible en el servidor.`)
    }
    return serverEnv[prop as keyof ServerEnv]
  },
})

/** Qué funcionalidades opcionales están configuradas (para "Estado del sistema"). */
export function featureFlags() {
  return {
    email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM && env.EMAIL_TO),
    blob: Boolean(env.BLOB_READ_WRITE_TOKEN),
    daemon: Boolean(env.DAEMON_URL && env.DAEMON_SECRET),
    cron: Boolean(env.CRON_SECRET),
    turnstile: Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  }
}
