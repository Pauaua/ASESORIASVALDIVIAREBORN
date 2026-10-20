'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState, useTransition, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  crearArchivo,
  crearCategoria,
  editarArchivo,
  editarCategoria,
  eliminarArchivo,
  eliminarCategoria,
} from '@/lib/actions/recursos'
import type { Resultado } from '@/lib/actions/resultado'
import { SUBIDAS } from '@/lib/subidas'
import { cn } from '@/lib/utils'
import {
  archivoSchema,
  categoriaSchema,
  type ArchivoInput,
  type ArchivoOutput,
  type CategoriaInput,
  type CategoriaOutput,
} from '@/lib/validators/recursos'
import { aplicarResultado, CampoTexto } from './formulario'
import { subirArchivo } from './subir-archivo'

export type Archivo = { id: number; name: string; url: string; type: string | null }
export type Categoria = {
  id: number
  name: string
  description: string | null
  files: Archivo[]
}

/** Solo enlaces http(s): cualquier otra cosa no se vuelve clickeable. */
function hrefSeguro(url: string) {
  return /^https?:\/\//i.test(url) ? url : undefined
}

function BadgeTipo({ tipo }: { tipo: string | null }) {
  const pdf = tipo === 'pdf'
  return (
    <Badge
      variant="secondary"
      className={cn(
        'shrink-0 border-transparent',
        pdf ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
      )}
    >
      {pdf ? 'PDF' : 'Link'}
    </Badge>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Vista de tarjetas (CLIENT y TEAM)                                                           */
/* ------------------------------------------------------------------------------------------ */

const ICONOS = [FileText, Globe, GraduationCap]

/**
 * Tarjetas de recursos. Para CLIENT la primera es la "BIBLIOTECA DIGITAL" con el link a su
 * carpeta de Google Drive. Cada tarjeta abre un diálogo con sus enlaces y PDF.
 */
export function VistaRecursos({
  categorias,
  driveURL,
}: {
  categorias: Categoria[]
  driveURL?: string | null
}) {
  const tarjetas: Categoria[] = [
    ...(driveURL !== undefined
      ? [
          {
            id: 0,
            name: 'BIBLIOTECA DIGITAL',
            description: 'Acceso a carpetas con documentos contables en formato digital.',
            files: driveURL
              ? [{ id: 0, type: 'link', name: 'Acceso a Google Drive', url: driveURL }]
              : [],
          },
        ]
      : []),
    ...categorias,
  ]

  if (tarjetas.length === 0) {
    return <p className="text-gray-500">Aún no hay recursos publicados.</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {tarjetas.map((c, i) => {
        const Icono = c.id === 0 ? FolderOpen : (ICONOS[i % ICONOS.length] ?? FileText)
        return (
          <li key={c.id}>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="h-full w-full rounded-lg border border-blue-100 bg-white p-6 text-left transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                >
                  <Icono className="mb-4 size-12 text-blue-600" aria-hidden="true" />
                  <span className="mb-2 block text-xl font-semibold text-blue-800">{c.name}</span>
                  {c.description && (
                    <span className="block text-sm text-gray-600">{c.description}</span>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="border-2 border-blue-200 bg-blue-50">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-blue-800">{c.name}</DialogTitle>
                  {c.description && <DialogDescription>{c.description}</DialogDescription>}
                </DialogHeader>
                <ul className="mt-2 space-y-3">
                  {c.files.length === 0 && (
                    <li className="text-sm text-gray-500 italic">
                      {c.id === 0
                        ? 'Tu carpeta de Drive aún no está configurada. Contacta a Asesorías Valdivia.'
                        : 'Sin archivos en esta categoría.'}
                    </li>
                  )}
                  {c.files.map((f) => {
                    const href = hrefSeguro(f.url)
                    const IconoArchivo = f.type === 'pdf' ? FileText : Globe
                    return (
                      <li
                        key={f.id}
                        className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                      >
                        <IconoArchivo
                          className={cn(
                            'size-6 shrink-0',
                            f.type === 'pdf' ? 'text-green-600' : 'text-blue-500',
                          )}
                          aria-hidden="true"
                        />
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium break-all text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {f.name}
                            <span className="sr-only"> (se abre en otra pestaña)</span>
                          </a>
                        ) : (
                          <span className="break-all">{f.name}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </DialogContent>
            </Dialog>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Administración (ADMIN)                                                                      */
/* ------------------------------------------------------------------------------------------ */

function DialogoCategoria({
  categoria,
  disparador,
}: {
  categoria?: Pick<Categoria, 'id' | 'name' | 'description'>
  disparador: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const valores = { name: categoria?.name ?? '', description: categoria?.description ?? '' }
  const form = useForm<CategoriaInput, unknown, CategoriaOutput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: valores,
  })
  const [guardando, startTransition] = useTransition()

  const onSubmit = form.handleSubmit((datos) => {
    startTransition(async () => {
      const r: Resultado<unknown> = categoria
        ? await editarCategoria(categoria.id, datos)
        : await crearCategoria(datos)
      if (aplicarResultado(r, form)) setAbierto(false)
    })
  })

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) form.reset(valores)
      }}
    >
      <DialogTrigger asChild>{disparador}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoria ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>
        <form id="form-categoria" onSubmit={onSubmit} noValidate className="space-y-4">
          <CampoTexto form={form} nombre="name" etiqueta="Nombre de la categoría" requerido />
          <CampoTexto form={form} nombre="description" etiqueta="Descripción (opcional)" />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="form-categoria"
            disabled={guardando}
            className="bg-brand-blue hover:bg-brand-blue/90"
          >
            {guardando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {categoria ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Agregar o editar un archivo/enlace. Para PDF se puede pegar una URL o subir el archivo. */
function DialogoArchivo({
  categorias,
  archivo,
  categoriaId,
  disparador,
}: {
  categorias: Pick<Categoria, 'id' | 'name'>[]
  archivo?: Archivo & { resourceId: number }
  categoriaId?: number
  disparador: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const valores: ArchivoInput = {
    name: archivo?.name ?? '',
    url: archivo?.url ?? '',
    type: archivo?.type === 'pdf' ? 'pdf' : 'link',
    resourceId: archivo?.resourceId ?? categoriaId ?? categorias[0]?.id ?? 0,
  }
  const form = useForm<ArchivoInput, unknown, ArchivoOutput>({
    resolver: zodResolver(archivoSchema),
    defaultValues: valores,
  })
  const tipo = useWatch({ control: form.control, name: 'type' })
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, startSubida] = useTransition()
  const [guardando, startTransition] = useTransition()

  const subirPdf = (f?: File) => {
    if (!f) return
    startSubida(async () => {
      try {
        form.setValue('url', await subirArchivo('recurso', f), { shouldValidate: true })
        if (!form.getValues('name')) form.setValue('name', f.name.replace(/\.pdf$/i, ''))
        toast.success('PDF subido. Guarda para publicarlo.')
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  const onSubmit = form.handleSubmit((datos) => {
    startTransition(async () => {
      const r = archivo ? await editarArchivo(archivo.id, datos) : await crearArchivo(datos)
      if (aplicarResultado(r, form)) setAbierto(false)
    })
  })

  const errorCategoria = form.formState.errors.resourceId
  const errorTipo = form.formState.errors.type

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) form.reset(valores)
      }}
    >
      <DialogTrigger asChild>{disparador}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{archivo ? 'Editar recurso' : 'Agregar recurso'}</DialogTitle>
        </DialogHeader>
        <form id="form-archivo" onSubmit={onSubmit} noValidate className="space-y-4">
          <Field data-invalid={Boolean(errorCategoria)}>
            <FieldLabel htmlFor="resourceId" className="text-sm text-slate-600">
              Categoría
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <NativeSelect id="resourceId" className="w-full" {...form.register('resourceId')}>
              {categorias.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errorCategoria]} />
          </Field>
          <CampoTexto
            form={form}
            nombre="name"
            etiqueta="Nombre del recurso"
            requerido
            placeholder="Ej: Guía de contabilidad 2024"
          />
          <Field data-invalid={Boolean(errorTipo)}>
            <FieldLabel htmlFor="type" className="text-sm text-slate-600">
              Tipo
            </FieldLabel>
            <NativeSelect id="type" className="w-full" {...form.register('type')}>
              <NativeSelectOption value="link">Enlace web</NativeSelectOption>
              <NativeSelectOption value="pdf">PDF</NativeSelectOption>
            </NativeSelect>
          </Field>
          <CampoTexto
            form={form}
            nombre="url"
            etiqueta="URL"
            requerido
            type="url"
            placeholder="https://..."
          />
          {tipo === 'pdf' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={subiendo}
                onClick={() => input.current?.click()}
              >
                {subiendo ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                Subir PDF
              </Button>
              <span className="text-xs text-gray-500">{SUBIDAS.recurso.descripcion}</span>
              <input
                ref={input}
                type="file"
                accept={SUBIDAS.recurso.extensiones}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => subirPdf(e.target.files?.[0])}
              />
            </div>
          )}
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="form-archivo"
            disabled={guardando || subiendo}
            className="bg-brand-blue hover:bg-brand-blue/90"
          >
            {guardando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {archivo ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Confirmar({
  titulo,
  descripcion,
  accion,
  etiqueta,
}: {
  titulo: string
  descripcion: ReactNode
  accion: () => Promise<Resultado<unknown>>
  etiqueta: string
}) {
  const [pendiente, startTransition] = useTransition()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-red-500 hover:text-red-700"
          aria-label={etiqueta}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pendiente}
            onClick={() => startTransition(async () => void aplicarResultado(await accion()))}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdministradorRecursos({ categorias }: { categorias: Categoria[] }) {
  const opciones = categorias.map(({ id, name }) => ({ id, name }))
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {categorias.length > 0 && (
          <DialogoArchivo
            categorias={opciones}
            disparador={
              <Button className="bg-brand-green text-brand-blue hover:bg-brand-blue hover:text-white">
                <Plus aria-hidden="true" /> Agregar recurso
              </Button>
            }
          />
        )}
        <DialogoCategoria
          disparador={
            <Button className="bg-brand-blue hover:bg-brand-green hover:text-brand-blue">
              <Plus aria-hidden="true" /> Nueva categoría
            </Button>
          }
        />
      </div>

      {categorias.length === 0 && (
        <p className="text-sm text-gray-500">No hay categorías aún. Crea la primera.</p>
      )}
      <div className="space-y-6">
        {categorias.map((c) => (
          <section
            key={c.id}
            aria-labelledby={`categoria-${c.id}`}
            className="overflow-hidden rounded-lg border"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3">
              <div>
                <h2 id={`categoria-${c.id}`} className="font-bold text-brand-blue">
                  {c.name}
                </h2>
                {c.description && <p className="mt-0.5 text-xs text-gray-500">{c.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <DialogoArchivo
                  categorias={opciones}
                  categoriaId={c.id}
                  disparador={
                    <Button
                      size="sm"
                      className="bg-brand-blue hover:bg-brand-green hover:text-brand-blue"
                    >
                      <Plus aria-hidden="true" /> Añadir<span className="sr-only"> a {c.name}</span>
                    </Button>
                  }
                />
                <DialogoCategoria
                  categoria={c}
                  disparador={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar categoría ${c.name}`}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                  }
                />
                <Confirmar
                  etiqueta={`Eliminar categoría ${c.name}`}
                  titulo={`¿Eliminar la categoría «${c.name}»?`}
                  descripcion={
                    c.files.length > 0
                      ? `También se eliminarán sus ${c.files.length} archivo(s). Esta acción no se puede deshacer.`
                      : 'La categoría está vacía. Esta acción no se puede deshacer.'
                  }
                  accion={() => eliminarCategoria(c.id)}
                />
              </div>
            </div>
            <ul className="divide-y">
              {c.files.length === 0 && (
                <li className="px-4 py-3 text-sm text-gray-400 italic">Sin archivos aún.</li>
              )}
              {c.files.map((f) => {
                const href = hrefSeguro(f.url)
                return (
                  <li key={f.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <BadgeTipo tipo={f.type} />
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm text-blue-600 hover:underline"
                        >
                          {f.name}
                        </a>
                      ) : (
                        <span className="truncate text-sm">{f.name}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <DialogoArchivo
                        categorias={opciones}
                        archivo={{ ...f, resourceId: c.id }}
                        disparador={
                          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${f.name}`}>
                            <Pencil aria-hidden="true" />
                          </Button>
                        }
                      />
                      <Confirmar
                        etiqueta={`Eliminar ${f.name}`}
                        titulo={`¿Eliminar «${f.name}»?`}
                        descripcion="Esta acción no se puede deshacer."
                        accion={() => eliminarArchivo(f.id)}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
