'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, LoaderCircle, Pencil } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { editarCliente } from '@/lib/actions/usuarios'
import {
  editarClienteAdminSchema,
  editarClienteDriveSchema,
  type EditarClienteInput,
  type EditarClienteOutput,
} from '@/lib/validators/usuarios'
import { aplicarResultado, CampoTexto } from './formulario'

/** Botón para abrir la carpeta de Drive del cliente en otra pestaña. */
export function AbrirCarpeta({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs whitespace-nowrap text-brand-blue hover:bg-gray-50"
    >
      <ExternalLink className="size-3.5" aria-hidden="true" /> Abrir carpeta
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  )
}

/**
 * Edición de un cliente en un panel lateral. ADMIN edita los datos comerciales y el Drive; TEAM
 * solo el Drive (el servidor aplica el mismo corte).
 */
export function EditarCliente({
  id,
  nombre,
  valores,
  comercial,
}: {
  id: number
  nombre: string
  valores: Required<{ [K in keyof EditarClienteInput]: string }>
  comercial: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const form = useForm<EditarClienteInput, unknown, EditarClienteOutput>({
    resolver: zodResolver(comercial ? editarClienteAdminSchema : editarClienteDriveSchema) as never,
    defaultValues: valores,
  })
  const [guardando, startTransition] = useTransition()

  const onSubmit = form.handleSubmit((datos) => {
    startTransition(async () => {
      const resultado = await editarCliente(id, datos)
      if (aplicarResultado(resultado, form)) setAbierto(false)
    })
  })

  return (
    <Sheet
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) form.reset(valores)
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil aria-hidden="true" /> Editar<span className="sr-only"> a {nombre}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar cliente</SheetTitle>
          <SheetDescription>{nombre}</SheetDescription>
        </SheetHeader>
        <form id={`cliente-${id}`} onSubmit={onSubmit} noValidate className="space-y-4 px-4">
          {comercial && (
            <>
              <CampoTexto form={form} nombre="company" etiqueta="Empresa" />
              <CampoTexto
                form={form}
                nombre="companyRUT"
                etiqueta="RUT empresa"
                placeholder="12.345.678-9"
              />
              <CampoTexto
                form={form}
                nombre="companyEmail"
                etiqueta="Correo empresa"
                type="email"
              />
              <CampoTexto
                form={form}
                nombre="companyPhone"
                etiqueta="Teléfono empresa"
                type="tel"
              />
            </>
          )}
          <CampoTexto
            form={form}
            nombre="driveURL"
            etiqueta="Link de Google Drive"
            type="url"
            placeholder="https://drive.google.com/…"
            descripcion="Debe empezar con https://drive.google.com/ o https://docs.google.com/"
          />
          {valores.driveURL && <AbrirCarpeta url={valores.driveURL} />}
        </form>
        <SheetFooter>
          <Button
            type="submit"
            form={`cliente-${id}`}
            disabled={guardando}
            className="bg-brand-blue hover:bg-brand-blue/90"
          >
            {guardando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
