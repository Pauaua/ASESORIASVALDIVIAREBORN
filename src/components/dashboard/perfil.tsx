'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, LoaderCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actualizarFotoPerfil, actualizarPerfil } from '@/lib/actions/usuarios'
import { SUBIDAS } from '@/lib/subidas'
import {
  perfilClienteSchema,
  type PerfilClienteInput,
  type PerfilClienteOutput,
} from '@/lib/validators/usuarios'
import { aplicarResultado, CampoTexto } from './formulario'
import { subirArchivo } from './subir-archivo'

export type ValoresPerfil = {
  username: string
  name: string
  lastname: string
  phone: string
  email: string
  company: string
  companyEmail: string
  companyPhone: string
  companyRUT: string
}

/**
 * Perfil propio. ADMIN y TEAM editan datos personales; CLIENT además la información comercial.
 * El servidor aplica el mismo corte por rol: los campos comerciales de ADMIN/TEAM se ignoran.
 */
export function FormularioPerfil({
  valores,
  comercial,
}: {
  valores: ValoresPerfil
  comercial: boolean
}) {
  const form = useForm<PerfilClienteInput, unknown, PerfilClienteOutput>({
    // El esquema de cliente es un superconjunto: el servidor descarta lo que no corresponde.
    resolver: zodResolver(perfilClienteSchema),
    defaultValues: { ...valores, password: '' },
  })
  const [guardando, startTransition] = useTransition()

  const onSubmit = form.handleSubmit((datos) => {
    startTransition(async () => {
      const resultado = await actualizarPerfil(datos)
      if (aplicarResultado(resultado, form)) form.reset({ ...form.getValues(), password: '' })
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-4 text-lg font-semibold md:text-xl">INFORMACIÓN GENERAL</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CampoTexto
            form={form}
            nombre="username"
            etiqueta="Nombre de usuario"
            requerido
            autoComplete="username"
          />
          <CampoTexto
            form={form}
            nombre="email"
            etiqueta="Correo electrónico"
            requerido
            type="email"
            autoComplete="email"
          />
          <CampoTexto
            form={form}
            nombre="name"
            etiqueta="Nombre"
            requerido
            autoComplete="given-name"
          />
          <CampoTexto
            form={form}
            nombre="lastname"
            etiqueta="Apellido"
            requerido
            autoComplete="family-name"
          />
          <CampoTexto
            form={form}
            nombre="phone"
            etiqueta="Teléfono"
            type="tel"
            autoComplete="tel"
          />
          <CampoTexto
            form={form}
            nombre="password"
            etiqueta="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Dejar en blanco para no cambiar"
            descripcion="Mínimo 8 caracteres."
          />
        </div>
      </fieldset>

      {comercial && (
        <fieldset className="space-y-4">
          <legend className="mb-4 text-lg font-semibold md:text-xl">INFORMACIÓN COMERCIAL</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CampoTexto
              form={form}
              nombre="company"
              etiqueta="Nombre de la empresa"
              autoComplete="organization"
            />
            <CampoTexto
              form={form}
              nombre="companyRUT"
              etiqueta="RUT empresa"
              placeholder="12.345.678-9"
            />
            <CampoTexto
              form={form}
              nombre="companyEmail"
              etiqueta="Correo electrónico comercial"
              type="email"
            />
            <CampoTexto
              form={form}
              nombre="companyPhone"
              etiqueta="Teléfono de contacto comercial"
              type="tel"
            />
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset({ ...valores, password: '' })}
          disabled={guardando}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando} className="bg-brand-blue hover:bg-brand-blue/90">
          {guardando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Actualizar datos
        </Button>
      </div>
    </form>
  )
}

/** Foto de perfil: se sube directo a Vercel Blob y luego se guarda la URL. */
export function FotoPerfil({ imagen }: { imagen: string | null }) {
  const input = useRef<HTMLInputElement>(null)
  const [pendiente, startTransition] = useTransition()

  const cambiar = (archivo: File | undefined) => {
    if (!archivo) return
    startTransition(async () => {
      try {
        const url = await subirArchivo('avatar', archivo)
        aplicarResultado(await actualizarFotoPerfil(url))
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  return (
    <div className="mb-8 flex flex-wrap items-center gap-4">
      <Image
        src={imagen || '/isotipouno.png'}
        alt="Tu foto de perfil"
        width={96}
        height={96}
        className="size-24 rounded-full border bg-white object-cover"
      />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pendiente}
            onClick={() => input.current?.click()}
          >
            {pendiente ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Camera aria-hidden="true" />
            )}
            Cambiar foto
          </Button>
          {imagen && (
            <Button
              type="button"
              variant="ghost"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => void aplicarResultado(await actualizarFotoPerfil(null)))
              }
            >
              <Trash2 aria-hidden="true" /> Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">{SUBIDAS.avatar.descripcion}.</p>
        <input
          ref={input}
          type="file"
          accept={SUBIDAS.avatar.extensiones}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => cambiar(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}
