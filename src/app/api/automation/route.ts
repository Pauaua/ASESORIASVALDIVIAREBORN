import { NextResponse } from 'next/server'
import { llamarDaemon, TIMEOUTS, type RespuestaDaemon } from '@/lib/daemon'
import { ErrorAutorizacion, requirePermiso } from '@/lib/session'
import {
  boletaIndividualSchema,
  facturaIndividualSchema,
  jobIdSchema,
  validarExcel,
} from '@/lib/validators/automatizacion'

/**
 * Proxy servidor → daemon de automatización SII (ADMIN y TEAM: 'automatizacion.ejecutar').
 *
 * Es un Route Handler y no una Server Action porque necesita `maxDuration` y reenviar el Excel
 * (multipart) al daemon. El contrato con el daemon no cambia (ver src/lib/daemon.ts).
 *
 * IMPORTANTE: el cuerpo trae la clave SII. No se registra, no se guarda y no se devuelve.
 */
export const maxDuration = 60

/** Últimas líneas de log que se envían al navegador. */
const LINEAS_LOG = 80

function responder(r: RespuestaDaemon) {
  switch (r.tipo) {
    case 'sin-configurar':
      return NextResponse.json({ error: 'Daemon no configurado (DAEMON_URL)' }, { status: 503 })
    case 'no-json':
      return NextResponse.json(
        { error: 'Respuesta no-JSON del daemon', raw: r.raw.slice(0, 500) },
        { status: 502 },
      )
    case 'error-red':
      return NextResponse.json({ error: `Error contactando daemon: ${r.mensaje}` }, { status: 502 })
    case 'json': {
      const data = r.data as Record<string, unknown> | null
      // FastAPI devuelve los errores como { detail }: se exponen también como `error`.
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (Array.isArray(data.logs)) data.logs = data.logs.slice(-LINEAS_LOG)
        if (r.status >= 400 && !data.error && typeof data.detail === 'string') {
          data.error = data.detail
        }
      }
      return NextResponse.json(data, { status: r.status })
    }
  }
}

async function autorizar() {
  try {
    await requirePermiso('automatizacion.ejecutar')
    return null
  } catch (error) {
    if (error instanceof ErrorAutorizacion) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}

const sinCache = { 'Cache-Control': 'no-store' }

// GET /api/automation?action=health | jobs | status&job_id=xxx
export async function GET(request: Request) {
  const denegado = await autorizar()
  if (denegado) return denegado

  const params = new URL(request.url).searchParams
  const action = params.get('action') ?? 'health'

  let ruta: string
  if (action === 'health') ruta = '/health'
  else if (action === 'jobs') ruta = '/jobs'
  else if (action === 'status') {
    const jobId = jobIdSchema.safeParse(params.get('job_id'))
    if (!jobId.success) return NextResponse.json({ error: 'Falta job_id' }, { status: 400 })
    ruta = `/status/${jobId.data}`
  } else {
    return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 })
  }

  const res = responder(await llamarDaemon(ruta, { timeoutMs: TIMEOUTS.consulta }))
  for (const [k, v] of Object.entries(sinCache)) res.headers.set(k, v)
  return res
}

// POST /api/automation
//   JSON:      { action: 'run_boletas_individual' | 'run_facturas_individual' | 'stop', ... }
//   multipart: type = 'boletas' | 'facturas', archivo, headless ('true' | 'false')
export async function POST(request: Request) {
  const denegado = await autorizar()
  if (denegado) return denegado

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 })
    }
    const tipo = form.get('type')
    if (tipo !== 'boletas' && tipo !== 'facturas') {
      return NextResponse.json({ error: 'Tipo de proceso inválido' }, { status: 400 })
    }
    const archivo = form.get('archivo')
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: 'Falta archivo Excel' }, { status: 400 })
    }
    const errorArchivo = validarExcel(archivo)
    if (errorArchivo) return NextResponse.json({ error: errorArchivo }, { status: 400 })

    const daemonForm = new FormData()
    // Se conserva el nombre: el daemon decide por la extensión si leer CSV o Excel.
    daemonForm.append('archivo', archivo, archivo.name)
    const headless = form.get('headless')
    if (headless === 'true' || headless === 'false') daemonForm.append('headless', headless)

    const ruta = tipo === 'boletas' ? '/run/boletas/masivo' : '/run/facturas/masivo'
    return responder(
      await llamarDaemon(ruta, { method: 'POST', form: daemonForm, timeoutMs: TIMEOUTS.masivo }),
    )
  }

  let body: { action?: unknown } & Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const { action, ...params } = body

  if (action === 'stop') {
    const jobId = jobIdSchema.safeParse(params.job_id)
    if (!jobId.success) return NextResponse.json({ error: 'Falta job_id' }, { status: 400 })
    return responder(
      await llamarDaemon(`/stop/${jobId.data}`, { method: 'POST', timeoutMs: TIMEOUTS.consulta }),
    )
  }

  const esquema =
    action === 'run_boletas_individual'
      ? { schema: boletaIndividualSchema, ruta: '/run/boletas/individual' }
      : action === 'run_facturas_individual'
        ? { schema: facturaIndividualSchema, ruta: '/run/facturas/individual' }
        : null
  if (!esquema) {
    return NextResponse.json({ error: `Acción desconocida: ${String(action)}` }, { status: 400 })
  }

  const parsed = esquema.schema.safeParse(params)
  if (!parsed.success) {
    // Solo rutas y mensajes de validación: nunca los valores enviados (podría ir la clave).
    return NextResponse.json(
      {
        error: 'Revisa los datos del formulario.',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    )
  }

  return responder(
    await llamarDaemon(esquema.ruta, {
      method: 'POST',
      json: parsed.data,
      timeoutMs: TIMEOUTS.individual,
    }),
  )
}
