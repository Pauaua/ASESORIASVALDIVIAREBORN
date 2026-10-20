'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Resultado } from '@/lib/actions/resultado'
import { cn } from '@/lib/utils'

/** Formulario de react-hook-form con cualquier esquema (los de Zod transforman la salida). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Formulario<T extends FieldValues> = UseFormReturn<T, any, any>

/**
 * Muestra el resultado de una Server Action: toast de éxito o error y, si vienen, los errores
 * por campo en el formulario. Devuelve true si la acción tuvo éxito.
 */
export function aplicarResultado<T extends FieldValues, D>(
  resultado: Resultado<D>,
  form?: Formulario<T>,
): resultado is Extract<Resultado<D>, { ok: true }> {
  if (resultado.ok) {
    if (resultado.mensaje) toast.success(resultado.mensaje)
    return true
  }
  if (form && resultado.fieldErrors) {
    for (const [campo, mensajes] of Object.entries(resultado.fieldErrors)) {
      if (mensajes?.[0]) form.setError(campo as Path<T>, { message: mensajes[0] })
    }
  }
  toast.error(resultado.error)
  return false
}

type CampoProps<T extends FieldValues> = {
  form: Formulario<T>
  nombre: Path<T>
  etiqueta: string
  descripcion?: ReactNode
  requerido?: boolean
  className?: string
} & Omit<React.ComponentProps<typeof Input>, 'form' | 'name'>

/** Input de texto conectado a react-hook-form, con etiqueta, ayuda y error accesibles. */
export function CampoTexto<T extends FieldValues>({
  form,
  nombre,
  etiqueta,
  descripcion,
  requerido,
  className,
  ...props
}: CampoProps<T>) {
  const error = form.formState.errors[nombre]
  const idAyuda = descripcion ? `${nombre}-ayuda` : undefined
  const idError = error ? `${nombre}-error` : undefined
  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldLabel htmlFor={nombre} className="text-sm text-slate-600">
        {etiqueta}
        {requerido && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLabel>
      <Input
        id={nombre}
        aria-invalid={Boolean(error)}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        aria-required={requerido || undefined}
        {...props}
        {...form.register(nombre)}
      />
      {descripcion && <FieldDescription id={idAyuda}>{descripcion}</FieldDescription>}
      <FieldError id={idError} errors={[error as { message?: string } | undefined]} />
    </Field>
  )
}

/** Caja de búsqueda que actualiza `?q=` en la URL (con pequeña espera) y vuelve a la página 1. */
export function Buscador({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [valor, setValor] = useState(searchParams.get('q') ?? '')
  const [pendiente, startTransition] = useTransition()
  const primera = useRef(true)

  useEffect(() => {
    if (primera.current) {
      primera.current = false
      return
    }
    const t = setTimeout(() => {
      const sp = new URLSearchParams(searchParams)
      if (valor.trim()) sp.set('q', valor.trim())
      else sp.delete('q')
      sp.delete('pagina')
      startTransition(() => router.replace(`${pathname}?${sp.toString()}`))
    }, 350)
    return () => clearTimeout(t)
    // searchParams cambia tras cada replace; solo reacciona al texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  return (
    <div role="search" className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
        aria-busy={pendiente}
      />
    </div>
  )
}
