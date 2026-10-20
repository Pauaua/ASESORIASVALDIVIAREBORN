'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  ReceiptText,
  Rocket,
  ScrollText,
  Square,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  boletaIndividualSchema,
  ESTADOS_TERMINALES,
  EXCEL,
  facturaIndividualSchema,
  MESES,
  validarExcel,
  type BoletaIndividualInput,
  type BoletaIndividualOutput,
  type EstadoJob,
  type FacturaIndividualInput,
  type FacturaIndividualOutput,
} from '@/lib/validators/automatizacion'
import { CampoTexto } from './formulario'

const INTERVALO_POLLING = 2500
const API = '/api/automation'

type Job = { status: EstadoJob; progress: number; logs: string[]; error?: string | null }

/** fetch a /api/automation con mensajes de error legibles (incluye respuestas no-JSON). */
async function pedir(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const texto = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(texto)
  } catch {
    throw new Error('El servidor no respondió correctamente (revisa que el daemon esté activo).')
  }
  if (!res.ok) {
    const err = new Error(
      String(data.error ?? data.detail ?? `Error ${res.status}`) +
        (typeof data.raw === 'string' ? ` — ${data.raw.slice(0, 200)}` : ''),
    ) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return data
}

/* ------------------------------------------------------------------------------------------ */
/* Estado del daemon                                                                           */
/* ------------------------------------------------------------------------------------------ */

function EstadoDaemon() {
  const [estado, setEstado] = useState<'verificando' | 'ok' | 'caido'>('verificando')

  useEffect(() => {
    let vigente = true
    pedir(`${API}?action=health`)
      .then((d) => vigente && setEstado(d.ok === true ? 'ok' : 'caido'))
      .catch(() => vigente && setEstado('caido'))
    return () => {
      vigente = false
    }
  }, [])

  const estilos = {
    verificando: ['bg-gray-100 text-gray-600', 'bg-gray-400', 'Verificando daemon…'],
    ok: ['bg-green-100 text-green-800', 'bg-green-500', 'Daemon conectado'],
    caido: [
      'bg-red-100 text-red-800',
      'bg-red-500',
      'Daemon no disponible — ejecuta iniciar_daemon.bat en el PC',
    ],
  } as const
  const [caja, punto, texto] = estilos[estado]
  return (
    <p
      role="status"
      className={cn('mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs', caja)}
    >
      <span className={cn('size-2 rounded-full', punto)} aria-hidden="true" />
      {texto}
    </p>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Seguimiento de un job                                                                       */
/* ------------------------------------------------------------------------------------------ */

/**
 * Sigue un job del daemon: consulta /status cada 2,5 s hasta un estado terminal. Si el daemon
 * responde 404, el job se perdió (el daemon se reinició).
 */
function useJob() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    if (!jobId) return
    let activo = true
    let timer: ReturnType<typeof setTimeout>
    const consultar = async () => {
      try {
        const d = (await pedir(`${API}?action=status&job_id=${encodeURIComponent(jobId)}`)) as Job
        if (!activo) return
        setJob(d)
        if (ESTADOS_TERMINALES.includes(d.status)) return
      } catch (e) {
        if (!activo) return
        if ((e as { status?: number }).status === 404) {
          setJob((j) => ({
            status: 'error',
            progress: j?.progress ?? 0,
            logs: j?.logs ?? [],
            error: 'Job no encontrado (daemon reiniciado)',
          }))
          return
        }
        // Errores transitorios (túnel, timeout): se reintenta en el siguiente ciclo.
      }
      timer = setTimeout(consultar, INTERVALO_POLLING)
    }
    timer = setTimeout(consultar, INTERVALO_POLLING)
    return () => {
      activo = false
      clearTimeout(timer)
    }
  }, [jobId])

  const iniciar = useCallback((id: string) => {
    setJob({ status: 'pending', progress: 0, logs: [] })
    setJobId(id)
  }, [])

  const detener = useCallback(async () => {
    if (!jobId) return
    try {
      await pedir(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', job_id: jobId }),
      })
    } catch (e) {
      setJob((j) => (j ? { ...j, error: (e as Error).message } : j))
    }
  }, [jobId])

  const enCurso = job !== null && !ESTADOS_TERMINALES.includes(job.status)
  return { job, iniciar, detener, enCurso }
}

const ETIQUETAS: Record<EstadoJob, string> = {
  pending: 'Pendiente…',
  running: 'Procesando…',
  done: 'Completado',
  error: 'Error',
  stopped: 'Detenido',
}

function ProgresoJob({ job, onDetener }: { job: Job | null; onDetener: () => void }) {
  const logs = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logs.current?.scrollTo({ top: logs.current.scrollHeight })
  }, [job?.logs.length])
  if (!job) return null
  const terminal = ESTADOS_TERMINALES.includes(job.status)
  const color =
    job.status === 'done'
      ? 'text-green-700'
      : job.status === 'error'
        ? 'text-red-700'
        : 'text-brand-blue'

  return (
    <section aria-label="Progreso del proceso" className="mt-6 rounded-lg border bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          role="status"
          aria-live="polite"
          className={cn('flex items-center gap-2 text-sm font-medium', color)}
        >
          {!terminal && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {ETIQUETAS[job.status]} · {job.progress}%
        </p>
        {!terminal && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={onDetener}
          >
            <Square aria-hidden="true" /> Detener
          </Button>
        )}
      </div>
      <Progress value={job.progress} aria-label="Avance" className="mb-3" />
      {job.error && (
        <p role="alert" className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">
          {job.error}
        </p>
      )}
      <div
        ref={logs}
        tabIndex={0}
        aria-label="Registro del proceso"
        className="max-h-60 space-y-0.5 overflow-y-auto rounded border bg-white p-2 font-mono text-xs text-gray-700"
      >
        {job.logs.length === 0 ? (
          <p className="text-gray-400">Esperando registros…</p>
        ) : (
          job.logs.slice(-80).map((linea, i) => <p key={i}>{linea}</p>)
        )}
      </div>
    </section>
  )
}

function ErrorLanzamiento({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null
  return (
    <p
      role="alert"
      className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {mensaje}
    </p>
  )
}

function BotonLanzar({
  enCurso,
  enviando,
  texto,
}: {
  enCurso: boolean
  enviando: boolean
  texto: string
}) {
  return (
    <Button
      type="submit"
      disabled={enCurso || enviando}
      className="h-11 w-full bg-brand-blue hover:bg-brand-blue/90"
    >
      {enCurso || enviando ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Rocket aria-hidden="true" />
      )}
      {enCurso ? 'Procesando…' : texto}
    </Button>
  )
}

function CheckHeadless({
  id,
  checked,
  onChange,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="text-sm font-normal text-gray-600">
        Modo silencioso (headless) — no abre ventana del navegador en el PC
      </Label>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Formularios individuales                                                                    */
/* ------------------------------------------------------------------------------------------ */

/** Fecha de hoy en Chile (para los valores por defecto de la boleta). */
function hoyEnChile() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [anio, mes, dia] = partes.split('-')
  return { dia: String(Number(dia)), mes: String(Number(mes)), anio: anio ?? '' }
}

function BoletasIndividual() {
  const hoy = hoyEnChile()
  const form = useForm<BoletaIndividualInput, unknown, BoletaIndividualOutput>({
    resolver: zodResolver(boletaIndividualSchema),
    defaultValues: {
      rut: '',
      clave: '',
      headless: true,
      rut_dest: '',
      dv_dest: '',
      nombres_dest: '',
      domicilio: '',
      region: '',
      comuna: '',
      fecha_dia: hoy.dia,
      fecha_mes: hoy.mes,
      fecha_anio: hoy.anio,
      prestaciones: Array.from({ length: 4 }, () => ({ glosa: '', valor: '' })),
    },
  })
  const { job, iniciar, detener, enCurso } = useJob()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const headless = useWatch({ control: form.control, name: 'headless' })

  const onSubmit = form.handleSubmit(async (datos) => {
    setError(null)
    setEnviando(true)
    try {
      const d = await pedir(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_boletas_individual', ...datos }),
      })
      iniciar(String(d.job_id))
      // La clave no se conserva en el formulario una vez enviada.
      form.setValue('clave', '')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  })

  const errorPrestacion = (i: number, campo: 'glosa' | 'valor') =>
    form.formState.errors.prestaciones?.[i]?.[campo]?.message

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ErrorLanzamiento mensaje={error} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoTexto
          form={form}
          nombre="rut"
          etiqueta="RUT emisor"
          requerido
          placeholder="76.123.456-7"
          autoComplete="off"
        />
        <CampoTexto
          form={form}
          nombre="clave"
          etiqueta="Clave SII"
          requerido
          type="password"
          autoComplete="off"
        />
      </div>
      <CheckHeadless
        id="headless-boleta"
        checked={headless}
        onChange={(v) => form.setValue('headless', v)}
      />

      <fieldset className="border-t pt-4">
        <legend className="pt-4 text-sm font-semibold text-gray-700">Fecha de la boleta</legend>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <CampoTexto
            form={form}
            nombre="fecha_dia"
            etiqueta="Día"
            requerido
            type="number"
            min={1}
            max={31}
          />
          <Field data-invalid={Boolean(form.formState.errors.fecha_mes)}>
            <FieldLabel htmlFor="fecha_mes" className="text-sm text-slate-600">
              Mes
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <NativeSelect id="fecha_mes" className="w-full" {...form.register('fecha_mes')}>
              {MESES.map((m, i) => (
                <NativeSelectOption key={m} value={String(i + 1)}>
                  {m}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <CampoTexto
            form={form}
            nombre="fecha_anio"
            etiqueta="Año"
            requerido
            type="number"
            min={2020}
            max={2099}
          />
        </div>
      </fieldset>

      <fieldset className="border-t pt-4">
        <legend className="pt-4 text-sm font-semibold text-gray-700">Destinatario</legend>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex gap-2">
            <CampoTexto
              form={form}
              nombre="rut_dest"
              etiqueta="RUT destinatario"
              requerido
              placeholder="12345678"
              className="flex-1"
              autoComplete="off"
            />
            <CampoTexto
              form={form}
              nombre="dv_dest"
              etiqueta="DV"
              requerido
              placeholder="K"
              maxLength={1}
              className="w-20"
              autoComplete="off"
            />
          </div>
          <CampoTexto
            form={form}
            nombre="nombres_dest"
            etiqueta="Nombre / razón social"
            requerido
          />
          <CampoTexto
            form={form}
            nombre="domicilio"
            etiqueta="Domicilio"
            requerido
            placeholder="Calle 123"
          />
          <CampoTexto form={form} nombre="region" etiqueta="Región" placeholder="Antofagasta" />
          <CampoTexto
            form={form}
            nombre="comuna"
            etiqueta="Comuna"
            requerido
            placeholder="Antofagasta"
          />
        </div>
      </fieldset>

      <fieldset className="border-t pt-4">
        <legend className="pt-4 text-sm font-semibold text-gray-700">
          Prestaciones (mínimo 1)
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => {
            const glosa = `prestaciones.${i}.glosa` as Path<BoletaIndividualInput>
            const valor = `prestaciones.${i}.valor` as Path<BoletaIndividualInput>
            return (
              <div key={i} className="space-y-2 rounded border p-3">
                <Field data-invalid={Boolean(errorPrestacion(i, 'glosa'))}>
                  <FieldLabel htmlFor={glosa} className="text-sm text-slate-600">
                    Prestación {i + 1}
                    {i === 0 && (
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    )}
                  </FieldLabel>
                  <Textarea
                    id={glosa}
                    rows={2}
                    placeholder="Descripción de la prestación"
                    {...form.register(glosa)}
                  />
                  <FieldError errors={[{ message: errorPrestacion(i, 'glosa') }]} />
                </Field>
                <Field data-invalid={Boolean(errorPrestacion(i, 'valor'))}>
                  <FieldLabel htmlFor={valor} className="sr-only">
                    Valor prestación {i + 1}
                  </FieldLabel>
                  <Input
                    id={valor}
                    inputMode="numeric"
                    placeholder="Valor ($)"
                    {...form.register(valor)}
                  />
                  <FieldError errors={[{ message: errorPrestacion(i, 'valor') }]} />
                </Field>
              </div>
            )
          })}
        </div>
      </fieldset>

      <BotonLanzar enCurso={enCurso} enviando={enviando} texto="Emitir boleta" />
      <ProgresoJob job={job} onDetener={detener} />
    </form>
  )
}

function FacturasIndividual() {
  const form = useForm<FacturaIndividualInput, unknown, FacturaIndividualOutput>({
    resolver: zodResolver(facturaIndividualSchema),
    defaultValues: { rut_empresa: '', rut_usuario: '', clave: '' },
  })
  const { job, iniciar, detener, enCurso } = useJob()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = form.handleSubmit(async (datos) => {
    setError(null)
    setEnviando(true)
    try {
      const d = await pedir(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_facturas_individual', ...datos }),
      })
      iniciar(String(d.job_id))
      form.setValue('clave', '')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ErrorLanzamiento mensaje={error} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoTexto
          form={form}
          nombre="rut_empresa"
          etiqueta="RUT empresa"
          requerido
          placeholder="76.123.456-7"
          autoComplete="off"
        />
        <CampoTexto
          form={form}
          nombre="rut_usuario"
          etiqueta="RUT usuario (si es distinto)"
          placeholder="Mismo que la empresa si se deja vacío"
          autoComplete="off"
        />
        <CampoTexto
          form={form}
          nombre="clave"
          etiqueta="Clave SII"
          requerido
          type="password"
          autoComplete="off"
          className="md:col-span-2"
        />
      </div>
      <BotonLanzar enCurso={enCurso} enviando={enviando} texto="Aceptar facturas" />
      <ProgresoJob job={job} onDetener={detener} />
    </form>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Masivo (Excel)                                                                              */
/* ------------------------------------------------------------------------------------------ */

const COLUMNAS = {
  boletas:
    'RUT | CLAVE | RUT_DEST | DV | NOMBRE_DEST | DOMICILIO | REGIÓN | COMUNA | FECHA_DIA | FECHA_MES | FECHA_ANIO | PRESTACION | VALOR',
  facturas: 'RUT_EMPRESA | RUT_USUARIO (opcional) | CLAVE',
} as const

function Masivo({ tipo }: { tipo: 'boletas' | 'facturas' }) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [headless, setHeadless] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const { job, iniciar, detener, enCurso } = useJob()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archivo) return setError('Selecciona un archivo Excel.')
    const invalido = validarExcel(archivo)
    if (invalido) return setError(invalido)
    setError(null)
    setEnviando(true)
    const fd = new FormData()
    fd.append('type', tipo)
    fd.append('archivo', archivo)
    if (tipo === 'boletas') fd.append('headless', headless ? 'true' : 'false')
    try {
      const d = await pedir(API, { method: 'POST', body: fd })
      iniciar(String(d.job_id))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <ErrorLanzamiento mensaje={error} />
      {tipo === 'boletas' && (
        <CheckHeadless id="headless-masivo" checked={headless} onChange={setHeadless} />
      )}
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
        <FileSpreadsheet className="mx-auto mb-2 size-8 text-gray-400" aria-hidden="true" />
        <p className="mb-1 text-sm text-gray-600">Columnas: {COLUMNAS[tipo]}</p>
        <p className="mb-4 text-xs text-gray-500">Formato {EXCEL.descripcion}.</p>
        <Label htmlFor={`archivo-${tipo}`} className="sr-only">
          Archivo Excel
        </Label>
        <input
          ref={input}
          id={`archivo-${tipo}`}
          type="file"
          accept={EXCEL.accept}
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="mx-auto block text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-brand-blue file:px-3 file:py-1.5 file:text-white"
        />
        {archivo && <p className="mt-2 text-xs text-green-700">Seleccionado: {archivo.name}</p>}
        <a
          href={`/plantillas/plantilla-${tipo}.xlsx`}
          download
          className="mt-4 inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"
        >
          <Download className="size-4" aria-hidden="true" /> Descargar plantilla de ejemplo
        </a>
      </div>
      <BotonLanzar enCurso={enCurso} enviando={enviando} texto="Iniciar proceso masivo" />
      <ProgresoJob job={job} onDetener={detener} />
    </form>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Pantalla principal                                                                          */
/* ------------------------------------------------------------------------------------------ */

const PROCESOS = {
  boletas: {
    titulo: 'Creación de Boletas',
    descripcion:
      'Emite boletas de honorarios electrónicas en el SII. Modo individual o carga masiva por Excel.',
    Icono: ScrollText,
  },
  facturas: {
    titulo: 'Facturas Electrónicas',
    descripcion:
      'Acepta facturas electrónicas pendientes en el SII. Modo individual o carga masiva por Excel.',
    Icono: ReceiptText,
  },
} as const

const montado = () => () => {}

export function Automatizacion() {
  const [proceso, setProceso] = useState<keyof typeof PROCESOS | null>(null)
  // Evita diferencias de hidratación con la fecha de hoy del formulario.
  const enCliente = useSyncExternalStore(
    montado,
    () => true,
    () => false,
  )

  return (
    <>
      <EstadoDaemon />
      {!proceso ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {(Object.keys(PROCESOS) as (keyof typeof PROCESOS)[]).map((clave) => {
            const { titulo, descripcion, Icono } = PROCESOS[clave]
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setProceso(clave)}
                className="group flex flex-col gap-4 rounded-lg border p-6 text-left transition-all hover:border-brand-blue hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-blue-50 p-3 transition-colors group-hover:bg-brand-blue">
                    <Icono
                      className="size-6 text-brand-blue group-hover:text-white"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-lg font-bold text-brand-blue">{titulo}</span>
                </span>
                <span className="text-sm text-gray-600">{descripcion}</span>
                <span className="mt-auto text-xs font-medium text-brand-blue group-hover:underline">
                  Iniciar →
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setProceso(null)}>
              <ArrowLeft aria-hidden="true" /> Volver
            </Button>
            <span className="text-gray-300" aria-hidden="true">
              /
            </span>
            <h2 className="text-sm font-semibold text-brand-blue">{PROCESOS[proceso].titulo}</h2>
          </div>
          <Tabs defaultValue="individual">
            <TabsList className="mb-6">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="masivo">Masivo (Excel)</TabsTrigger>
            </TabsList>
            <TabsContent value="individual">
              {enCliente &&
                (proceso === 'boletas' ? <BoletasIndividual /> : <FacturasIndividual />)}
            </TabsContent>
            <TabsContent value="masivo">
              <Masivo tipo={proceso} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  )
}
