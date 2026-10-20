/**
 * Mock local del daemon de automatización SII, con el mismo contrato HTTP que el real
 * (../DAEMON/daemon.py). Simula jobs con progreso y logs para probar el panel sin el PC de la
 * oficina ni el SII.
 *
 * Uso:
 *   npm run mock:daemon                       # escucha en http://localhost:8765
 *   PORT=9000 DAEMON_SECRET=otro npm run mock:daemon
 *
 * En .env:  DAEMON_URL=http://localhost:8765  y  DAEMON_SECRET=<el mismo secreto>
 *
 * Comportamientos para probar casos borde:
 *   - Un RUT emisor/empresa que empieza con "99" termina en error.
 *   - Un Excel cuyo nombre contiene "html" responde HTML (simula el túnel caído → 502 no-JSON).
 *   - Reiniciar el mock pierde los jobs: el panel debe mostrar "Job no encontrado".
 *
 * Nunca imprime la clave SII: solo registra rutas y estados.
 */
import 'dotenv/config'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 8765)
const SECRET = process.env.DAEMON_SECRET || 'dev-secret'

type Job = {
  status: 'pending' | 'running' | 'done' | 'error' | 'stopped'
  progress: number
  logs: string[]
  started_at: string
  error: string | null
  timer?: NodeJS.Timeout
}

const JOBS = new Map<string, Job>()

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function leerCuerpo(req: IncomingMessage) {
  const partes: Buffer[] = []
  for await (const parte of req) partes.push(parte as Buffer)
  return Buffer.concat(partes)
}

/** Simula un proceso: N pasos, un log por paso, progreso proporcional. */
function iniciarJob(descripcion: string, pasos: string[], fallar: boolean) {
  const id = randomUUID().slice(0, 8)
  const job: Job = {
    status: 'pending',
    progress: 0,
    logs: [`Iniciando: ${descripcion}`],
    started_at: new Date().toISOString(),
    error: null,
  }
  JOBS.set(id, job)
  let i = 0
  setTimeout(() => {
    job.status = 'running'
    job.timer = setInterval(() => {
      if (job.status !== 'running') return clearInterval(job.timer)
      const paso = pasos[i]
      if (paso) job.logs.push(paso)
      i++
      job.progress = Math.min(99, Math.round((i / pasos.length) * 100))
      if (fallar && i === Math.ceil(pasos.length / 2)) {
        job.status = 'error'
        job.progress = 100
        job.error = 'Error simulado: el SII rechazó el inicio de sesión'
        job.logs.push(`❌ ${job.error}`)
        clearInterval(job.timer)
      } else if (i >= pasos.length) {
        job.status = 'done'
        job.progress = 100
        job.logs.push('✅ Proceso terminado')
        clearInterval(job.timer)
      }
    }, 700)
  }, 300)
  console.log(`[mock] job ${id} creado: ${descripcion}`)
  return id
}

const PASOS_BOLETA = [
  'Abriendo navegador…',
  'Ingresando al SII…',
  'Autenticación correcta',
  'Abriendo formulario de boleta de honorarios',
  'Completando datos del destinatario',
  'Agregando prestaciones',
  'Revisando totales',
  'Emitiendo boleta',
]

const PASOS_FACTURA = [
  'Abriendo navegador…',
  'Ingresando al SII…',
  'Seleccionando empresa',
  'Buscando facturas pendientes',
  'Aceptando factura 1 de 3',
  'Aceptando factura 2 de 3',
  'Aceptando factura 3 de 3',
]

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const ruta = url.pathname
  console.log(`[mock] ${req.method} ${ruta}`)

  if (req.method === 'GET' && ruta === '/health') {
    return json(res, 200, { ok: true, boletas: true, facturas: true })
  }

  if (req.headers['x-daemon-secret'] !== SECRET) return json(res, 403, { detail: 'Token inválido' })

  if (req.method === 'GET' && ruta === '/jobs') {
    return json(
      res,
      200,
      [...JOBS].map(([job_id, j]) => ({
        job_id,
        status: j.status,
        progress: j.progress,
        started_at: j.started_at,
      })),
    )
  }

  const status = /^\/status\/([\w-]+)$/.exec(ruta)
  if (req.method === 'GET' && status?.[1]) {
    const job = JOBS.get(status[1])
    if (!job) return json(res, 404, { detail: 'Job no encontrado' })
    const { timer: _timer, ...publico } = job
    return json(res, 200, { job_id: status[1], ...publico })
  }

  const stop = /^\/stop\/([\w-]+)$/.exec(ruta)
  if (req.method === 'POST' && stop?.[1]) {
    const job = JOBS.get(stop[1])
    if (!job) return json(res, 404, { detail: 'Job no encontrado' })
    if (job.status === 'running' || job.status === 'pending') {
      job.status = 'stopped'
      job.logs.push('⏹️ Detenido por el usuario')
      clearInterval(job.timer)
    }
    return json(res, 200, { ok: true })
  }

  if (req.method === 'POST' && ruta === '/run/boletas/individual') {
    const body = JSON.parse((await leerCuerpo(req)).toString('utf8') || '{}')
    const campos = ['rut', 'clave', 'rut_dest', 'dv_dest', 'nombres_dest', 'domicilio', 'region']
    const faltan = [
      ...campos,
      'comuna',
      'fecha_dia',
      'fecha_mes',
      'fecha_anio',
      'prestaciones',
    ].filter((c) => body[c] === undefined)
    if (faltan.length) return json(res, 422, { detail: `Faltan campos: ${faltan.join(', ')}` })
    const n = Array.isArray(body.prestaciones) ? body.prestaciones.length : 0
    const id = iniciarJob(
      `boleta individual (${n} prestación(es), headless=${body.headless})`,
      PASOS_BOLETA,
      String(body.rut).startsWith('99'),
    )
    return json(res, 200, { job_id: id })
  }

  if (req.method === 'POST' && ruta === '/run/facturas/individual') {
    const body = JSON.parse((await leerCuerpo(req)).toString('utf8') || '{}')
    if (!body.rut_empresa || !body.rut_usuario || !body.clave) {
      return json(res, 422, { detail: 'Faltan campos: rut_empresa, rut_usuario, clave' })
    }
    const id = iniciarJob(
      'facturas individual',
      PASOS_FACTURA,
      String(body.rut_empresa).startsWith('99'),
    )
    return json(res, 200, { job_id: id })
  }

  if (
    req.method === 'POST' &&
    (ruta === '/run/boletas/masivo' || ruta === '/run/facturas/masivo')
  ) {
    // Se parsea con la API Fetch, igual que haría FastAPI con UploadFile.
    const request = new Request(url, {
      method: 'POST',
      headers: req.headers as Record<string, string>,
      body: await leerCuerpo(req),
    })
    const form = await request.formData()
    const archivo = form.get('archivo')
    if (!(archivo instanceof File)) return json(res, 422, { detail: 'Falta archivo' })
    if (archivo.name.toLowerCase().includes('html')) {
      res.writeHead(502, { 'Content-Type': 'text/html' })
      return res.end(
        '<html><body><h1>502 Bad Gateway</h1>cloudflared: túnel no disponible</body></html>',
      )
    }
    const esBoletas = ruta.includes('boletas')
    const id = iniciarJob(
      `${esBoletas ? 'boletas' : 'facturas'} masivo: ${archivo.name} (${archivo.size} bytes, headless=${form.get('headless') ?? 'n/a'})`,
      esBoletas ? [...PASOS_BOLETA, 'Fila 2 de 3', 'Fila 3 de 3'] : PASOS_FACTURA,
      archivo.name.includes('99'),
    )
    return json(res, 200, { job_id: id })
  }

  return json(res, 404, { detail: 'Not Found' })
})

server.listen(PORT, () => {
  console.log(
    `[mock] daemon simulado en http://localhost:${PORT} (secreto: ${SECRET === 'dev-secret' ? 'dev-secret' : '(DAEMON_SECRET)'})`,
  )
})
