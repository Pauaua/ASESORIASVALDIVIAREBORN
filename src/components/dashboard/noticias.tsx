'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Markdown } from '@/components/site/markdown'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  cambiarPublicacion,
  crearNoticia,
  editarNoticia,
  eliminarNoticia,
} from '@/lib/actions/noticias'
import { SUBIDAS } from '@/lib/subidas'
import {
  noticiaSchema,
  slugificar,
  type NoticiaInput,
  type NoticiaOutput,
} from '@/lib/validators/noticias'
import { aplicarResultado, CampoTexto } from './formulario'
import { subirArchivo } from './subir-archivo'

/** Switch publicada / borrador en el listado. */
export function SwitchPublicada({
  id,
  publicada,
  titulo,
}: {
  id: number
  publicada: boolean
  titulo: string
}) {
  const [optimista, setOptimista] = useOptimistic(publicada)
  const [, startTransition] = useTransition()
  return (
    <Switch
      checked={optimista}
      aria-label={`${optimista ? 'Despublicar' : 'Publicar'} «${titulo}»`}
      onCheckedChange={(v) =>
        startTransition(async () => {
          setOptimista(v)
          aplicarResultado(await cambiarPublicacion(id, v))
        })
      }
    />
  )
}

export function EliminarNoticia({ id, titulo }: { id: number; titulo: string }) {
  const [pendiente, startTransition] = useTransition()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-red-600"
          aria-label={`Eliminar «${titulo}»`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta noticia?</AlertDialogTitle>
          <AlertDialogDescription>
            «{titulo}» dejará de estar en el sitio. Esta acción no se puede deshacer; si solo
            quieres ocultarla, despublícala.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pendiente}
            onClick={() =>
              startTransition(async () => void aplicarResultado(await eliminarNoticia(id)))
            }
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export type ValoresNoticia = {
  title: string
  slug: string
  publishedAt: string
  image: string | null
  imageAlt: string
  excerpt: string
  content: string
  sources: string
  published: boolean
}

function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
}

/** Editor de noticias (crear y editar): markdown con vista previa e imagen en Vercel Blob. */
export function EditorNoticia({ id, valores }: { id?: number; valores?: ValoresNoticia }) {
  const router = useRouter()
  const form = useForm<NoticiaInput, unknown, NoticiaOutput>({
    resolver: zodResolver(noticiaSchema),
    defaultValues: valores ?? {
      title: '',
      slug: '',
      publishedAt: hoy(),
      image: null,
      imageAlt: '',
      excerpt: '',
      content: '',
      sources: '',
      published: false,
    },
  })
  const [titulo, contenido, imagen, publicada, slug] = useWatch({
    control: form.control,
    name: ['title', 'content', 'image', 'published', 'slug'],
  })
  const [guardando, startTransition] = useTransition()
  const [subiendo, startSubida] = useTransition()
  const [pestana, setPestana] = useState('escribir')
  const input = useRef<HTMLInputElement>(null)

  const subir = (archivo?: File) => {
    if (!archivo) return
    startSubida(async () => {
      try {
        form.setValue('image', await subirArchivo('noticia', archivo), { shouldDirty: true })
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  const onSubmit = form.handleSubmit((datos) => {
    startTransition(async () => {
      if (id) {
        aplicarResultado(await editarNoticia(id, datos), form)
        return
      }
      const r = await crearNoticia(datos)
      if (aplicarResultado(r, form)) router.push(`/dashboard/noticias/${r.data.id}`)
    })
  })

  const error = (campo: keyof NoticiaInput) => form.formState.errors[campo]?.message

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <CampoTexto form={form} nombre="title" etiqueta="Título" requerido />
        <CampoTexto
          form={form}
          nombre="slug"
          etiqueta="Dirección (slug)"
          placeholder={slugificar(String(titulo ?? '')) || 'se-genera-desde-el-titulo'}
          descripcion={`/noticias/${slug || slugificar(String(titulo ?? '')) || '…'} — déjalo vacío para generarlo desde el título.`}
        />
        <Field data-invalid={Boolean(error('excerpt'))}>
          <FieldLabel htmlFor="excerpt" className="text-sm text-slate-600">
            Extracto
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Textarea
            id="excerpt"
            rows={2}
            aria-invalid={Boolean(error('excerpt'))}
            {...form.register('excerpt')}
          />
          <FieldDescription>
            Resumen corto para la grilla, buscadores y redes (máx. 300).
          </FieldDescription>
          <FieldError errors={[{ message: error('excerpt') }]} />
        </Field>

        <Tabs value={pestana} onValueChange={setPestana}>
          <div className="flex items-center justify-between">
            <Label htmlFor="content" className="text-sm text-slate-600">
              Contenido (markdown)
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <TabsList>
              <TabsTrigger value="escribir">Escribir</TabsTrigger>
              <TabsTrigger value="vista">Vista previa</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="escribir" forceMount className="data-[state=inactive]:hidden">
            <Textarea
              id="content"
              rows={18}
              className="font-mono text-sm"
              aria-invalid={Boolean(error('content'))}
              aria-describedby="content-ayuda"
              {...form.register('content')}
            />
            <p id="content-ayuda" className="mt-1 text-xs text-gray-500">
              Párrafos separados por una línea en blanco. **negrita**, *cursiva*, ## Subtítulo, -
              lista, [texto](https://enlace).
            </p>
            <FieldError errors={[{ message: error('content') }]} />
          </TabsContent>
          <TabsContent value="vista">
            <div className="min-h-64 rounded-lg border bg-white p-4 text-gray-800">
              {contenido ? (
                <Markdown>{String(contenido)}</Markdown>
              ) : (
                <p className="text-gray-400">Nada que mostrar aún.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Field data-invalid={Boolean(error('sources'))}>
          <FieldLabel htmlFor="sources" className="text-sm text-slate-600">
            Fuentes
          </FieldLabel>
          <Textarea
            id="sources"
            rows={3}
            placeholder="https://www.sii.cl/…"
            aria-invalid={Boolean(error('sources'))}
            {...form.register('sources')}
          />
          <FieldDescription>Una URL por línea.</FieldDescription>
          <FieldError errors={[{ message: error('sources') }]} />
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="space-y-4 rounded-lg border p-4">
          <CampoTexto
            form={form}
            nombre="publishedAt"
            etiqueta="Fecha de publicación"
            requerido
            type="date"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="published"
              checked={Boolean(publicada)}
              onCheckedChange={(v) => form.setValue('published', v === true, { shouldDirty: true })}
            />
            <Label htmlFor="published" className="font-normal">
              Publicada (visible en el sitio)
            </Label>
          </div>
          <Button
            type="submit"
            disabled={guardando || subiendo}
            className="w-full bg-brand-blue hover:bg-brand-blue/90"
          >
            {guardando ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : publicada ? (
              <Eye aria-hidden="true" />
            ) : (
              <EyeOff aria-hidden="true" />
            )}
            {publicada ? 'Guardar y publicar' : 'Guardar borrador'}
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium text-slate-600">Imagen principal</p>
          {imagen ? (
            <div className="relative aspect-video overflow-hidden rounded">
              <Image src={String(imagen)} alt="" fill sizes="320px" className="object-cover" />
            </div>
          ) : (
            <p className="rounded border border-dashed p-6 text-center text-xs text-gray-500">
              Sin imagen
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={subiendo}
              onClick={() => input.current?.click()}
            >
              {subiendo ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus aria-hidden="true" />
              )}
              {imagen ? 'Cambiar' : 'Subir imagen'}
            </Button>
            {imagen && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.setValue('image', null, { shouldDirty: true })}
              >
                <Trash2 aria-hidden="true" /> Quitar
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">{SUBIDAS.noticia.descripcion}. Ideal 1600×900 px.</p>
          {error('image') && <p className="text-sm text-destructive">{error('image')}</p>}
          <input
            ref={input}
            type="file"
            accept={SUBIDAS.noticia.extensiones}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => subir(e.target.files?.[0])}
          />
          <CampoTexto
            form={form}
            nombre="imageAlt"
            etiqueta="Descripción de la imagen"
            descripcion="Para lectores de pantalla. Déjala vacía si la imagen es decorativa."
          />
        </div>
      </aside>
    </form>
  )
}
