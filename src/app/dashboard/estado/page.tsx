import { CheckCircle2, CircleAlert, CircleX } from 'lucide-react'
import { enSuspense } from '@/components/dashboard/carga'
import { BotonCorreoPrueba } from '@/components/dashboard/estado'
import { Panel } from '@/components/dashboard/panel'
import { env, featureFlags } from '@/env'
import { saludDaemon } from '@/lib/daemon'
import { db } from '@/lib/db'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Estado del sistema' }

type Nivel = 'ok' | 'aviso' | 'error'

function Indicador({ nivel, children }: { nivel: Nivel; children: React.ReactNode }) {
  const Icono = nivel === 'ok' ? CheckCircle2 : nivel === 'aviso' ? CircleAlert : CircleX
  const color =
    nivel === 'ok' ? 'text-green-700' : nivel === 'aviso' ? 'text-amber-700' : 'text-red-700'
  return (
    <span className={`inline-flex items-center gap-1.5 ${color}`}>
      <Icono className="size-4" aria-hidden="true" />
      {children}
    </span>
  )
}

async function baseDeDatos(): Promise<Nivel> {
  try {
    await db.$queryRaw`SELECT 1`
    return 'ok'
  } catch {
    return 'error'
  }
}

/**
 * Estado del sistema (solo ADMIN). Solo muestra si cada variable está configurada o no: nunca
 * su valor (reemplaza al antiguo `?action=debug` de /api/automation).
 */
async function EstadoPage() {
  await requirePagina('sistema.estado')
  const [daemon, bd] = await Promise.all([saludDaemon(), baseDeDatos()])
  const flags = featureFlags()

  const variables: [string, boolean, string][] = [
    ['DATABASE_URL', true, 'Base de datos (Neon)'],
    ['AUTH_SECRET', true, 'Firma de sesiones'],
    ['RESEND_API_KEY', Boolean(env.RESEND_API_KEY), 'Envío de correos'],
    ['EMAIL_FROM', Boolean(env.EMAIL_FROM), 'Remitente de los correos'],
    ['EMAIL_TO', Boolean(env.EMAIL_TO), 'Destino de las notificaciones de formularios'],
    ['BLOB_READ_WRITE_TOKEN', flags.blob, 'Subida de fotos, PDF e imágenes'],
    ['DAEMON_URL', Boolean(env.DAEMON_URL), 'URL del daemon (túnel)'],
    ['DAEMON_SECRET', Boolean(env.DAEMON_SECRET), 'Secreto compartido con el daemon'],
    ['CRON_SECRET', flags.cron, 'Recordatorio mensual de boletas'],
    ['TURNSTILE_SECRET_KEY', flags.turnstile, 'Captcha de formularios (opcional)'],
  ]

  return (
    <Panel titulo="ESTADO DEL SISTEMA">
      <dl className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <dt className="mb-1 text-sm text-gray-500">Base de datos</dt>
          <dd>
            <Indicador nivel={bd}>{bd === 'ok' ? 'Conectada' : 'Sin conexión'}</Indicador>
          </dd>
        </div>
        <div className="rounded-lg border p-4">
          <dt className="mb-1 text-sm text-gray-500">Daemon de automatización</dt>
          <dd>
            {daemon === 'conectado' && <Indicador nivel="ok">Conectado</Indicador>}
            {daemon === 'no-disponible' && (
              <Indicador nivel="error">
                No disponible — ejecuta iniciar_daemon.bat en el PC
              </Indicador>
            )}
            {daemon === 'sin-configurar' && <Indicador nivel="aviso">Sin configurar</Indicador>}
          </dd>
        </div>
        <div className="rounded-lg border p-4">
          <dt className="mb-1 text-sm text-gray-500">Correo (Resend)</dt>
          <dd className="space-y-2">
            <Indicador nivel={flags.email ? 'ok' : 'aviso'}>
              {flags.email ? 'Configurado' : 'Incompleto'}
            </Indicador>
            <div>
              <BotonCorreoPrueba habilitado={Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)} />
            </div>
          </dd>
        </div>
      </dl>

      <h2 className="mb-3 text-lg font-semibold text-brand-blue">Variables de entorno</h2>
      <p className="mb-3 text-sm text-gray-500">
        Solo se indica si cada variable está definida; los valores nunca se muestran.
      </p>
      <ul className="divide-y rounded-lg border">
        {variables.map(([nombre, definida, uso]) => (
          <li key={nombre} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span>
              <code className="text-sm">{nombre}</code>
              <span className="ml-2 text-xs text-gray-500">{uso}</span>
            </span>
            <Indicador nivel={definida ? 'ok' : 'aviso'}>
              {definida ? 'Configurada' : 'No configurada'}
            </Indicador>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export default enSuspense(EstadoPage)
