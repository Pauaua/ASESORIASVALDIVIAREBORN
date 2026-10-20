'use client'

import { Download, LoaderCircle, Mail, MailOpen, Phone, Trash2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { eliminarMensaje, exportarMensajesCsv, marcarLeido } from '@/lib/actions/mensajes'
import { cn } from '@/lib/utils'
import type { TipoMensaje } from '@/lib/validators/mensajes'
import { aplicarResultado } from './formulario'

export type MensajeVista = {
  id: number
  tipo: TipoMensaje
  nombre: string
  apellido: string
  correo: string
  telefono: string | null
  mensaje: string
  servicio: string | null
  leido: boolean
  fecha: string
}

type Permisos = { eliminar: boolean; crearUsuario: boolean }

function TarjetaMensaje({ m, permisos }: { m: MensajeVista; permisos: Permisos }) {
  const [leido, setLeido] = useOptimistic(m.leido)
  const [pendiente, startTransition] = useTransition()
  const ref = { tipo: m.tipo, id: m.id }

  const cambiarLeido = (valor: boolean, silencioso = false) =>
    startTransition(async () => {
      setLeido(valor)
      const r = await marcarLeido(ref, valor)
      if (!silencioso || !r.ok) aplicarResultado(r)
    })

  return (
    <li
      className={cn(
        'rounded-lg border p-4',
        leido ? 'bg-white' : 'border-brand-blue/40 bg-blue-50/60',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-brand-blue">
            {!leido && (
              <span
                className="mr-2 inline-block size-2 rounded-full bg-brand-amber"
                aria-hidden="true"
              />
            )}
            {m.nombre} {m.apellido}
            {!leido && <span className="sr-only"> (no leído)</span>}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <a
              href={`mailto:${m.correo}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <Mail className="size-3.5" aria-hidden="true" /> {m.correo}
            </a>
            {m.telefono && (
              <a
                href={`tel:${m.telefono}`}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <Phone className="size-3.5" aria-hidden="true" /> {m.telefono}
              </a>
            )}
            {m.servicio && <span>Servicio: {m.servicio}</span>}
          </p>
        </div>
        <time className="text-xs whitespace-nowrap text-gray-500">{m.fecha}</time>
      </div>

      <details
        className="mt-3"
        onToggle={(e) => {
          // Abrir un mensaje no leído lo marca como leído.
          if ((e.currentTarget as HTMLDetailsElement).open && !leido) cambiarLeido(true, true)
        }}
      >
        <summary className="cursor-pointer text-sm text-brand-blue hover:underline">
          <span className="line-clamp-1 inline">{m.mensaje.slice(0, 120)}</span>
        </summary>
        <p className="mt-2 rounded bg-white p-3 text-sm whitespace-pre-wrap">{m.mensaje}</p>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pendiente}
          onClick={() => cambiarLeido(!leido)}
        >
          {leido ? <Mail aria-hidden="true" /> : <MailOpen aria-hidden="true" />}
          {leido ? 'Marcar como no leído' : 'Marcar como leído'}
        </Button>
        {m.tipo === 'solicitud' && permisos.crearUsuario && (
          <Button asChild size="sm" className="bg-brand-blue hover:bg-brand-blue/90">
            <Link href={`/dashboard/usuarios/nuevo?solicitud=${m.id}`}>
              <UserPlus aria-hidden="true" /> Crear usuario
            </Link>
          </Button>
        )}
        {permisos.eliminar && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 aria-hidden="true" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este mensaje?</AlertDialogTitle>
                <AlertDialogDescription>
                  Mensaje de {m.nombre} {m.apellido}. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    startTransition(async () => void aplicarResultado(await eliminarMensaje(ref)))
                  }
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </li>
  )
}

export function ListaMensajes({
  mensajes,
  permisos,
}: {
  mensajes: MensajeVista[]
  permisos: Permisos
}) {
  return (
    <ul className="space-y-3">
      {mensajes.map((m) => (
        <TarjetaMensaje key={`${m.tipo}-${m.id}`} m={m} permisos={permisos} />
      ))}
    </ul>
  )
}

/** Filtros por fecha y estado (la búsqueda por texto usa el Buscador común). */
export function FiltrosMensajes() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()

  const cambiar = (clave: string, valor: string) => {
    const p = new URLSearchParams(sp)
    if (valor && valor !== 'todos') p.set(clave, valor)
    else p.delete(clave)
    p.delete('pagina')
    startTransition(() => router.replace(`${pathname}?${p.toString()}`))
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="desde" className="text-xs text-gray-600">
          Desde
        </Label>
        <Input
          id="desde"
          type="date"
          defaultValue={sp.get('desde') ?? ''}
          onChange={(e) => cambiar('desde', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hasta" className="text-xs text-gray-600">
          Hasta
        </Label>
        <Input
          id="hasta"
          type="date"
          defaultValue={sp.get('hasta') ?? ''}
          onChange={(e) => cambiar('hasta', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="estado" className="text-xs text-gray-600">
          Estado
        </Label>
        <NativeSelect
          id="estado"
          defaultValue={sp.get('estado') ?? 'todos'}
          onChange={(e) => cambiar('estado', e.target.value)}
        >
          <NativeSelectOption value="todos">Todos</NativeSelectOption>
          <NativeSelectOption value="no-leidos">No leídos</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  )
}

/** Descarga la pestaña actual (con sus filtros) como CSV. Solo ADMIN. */
export function ExportarCsv({
  filtros,
  nombre,
}: {
  filtros: Record<string, unknown>
  nombre: string
}) {
  const [pendiente, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pendiente}
      onClick={() =>
        startTransition(async () => {
          const r = await exportarMensajesCsv(filtros)
          if (!r.ok) {
            toast.error(r.error)
            return
          }
          const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv;charset=utf-8' }))
          const a = document.createElement('a')
          a.href = url
          a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`
          a.click()
          URL.revokeObjectURL(url)
        })
      }
    >
      {pendiente ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Download aria-hidden="true" />
      )}
      Exportar CSV
    </Button>
  )
}
