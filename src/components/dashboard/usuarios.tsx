'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, LoaderCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOptimistic, useRef, useState, useTransition } from 'react'
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  cambiarEstadoUsuario,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
} from '@/lib/actions/usuarios'
import { ETIQUETA_ROL, MENSAJES_REGLA, type Rol } from '@/lib/rbac'
import { SUBIDAS } from '@/lib/subidas'
import { cn } from '@/lib/utils'
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  type CrearUsuarioInput,
  type CrearUsuarioOutput,
  type EditarUsuarioInput,
  type EditarUsuarioOutput,
} from '@/lib/validators/usuarios'
import { aplicarResultado, CampoTexto, type Formulario } from './formulario'
import { subirArchivo } from './subir-archivo'

const COLOR_ROL: Record<Rol, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  TEAM: 'bg-blue-100 text-blue-800',
  CLIENT: 'bg-green-100 text-green-800',
}

export function BadgeRol({ rol }: { rol: Rol }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent', COLOR_ROL[rol])}>
      {ETIQUETA_ROL[rol]}
    </Badge>
  )
}

/**
 * Switch activo/inactivo de una fila. En la fila propia aparece deshabilitado con una
 * explicación: nadie puede activarse ni desactivarse a sí mismo.
 */
export function SwitchEstado({
  id,
  activo,
  esPropio,
  etiqueta,
}: {
  id: number
  activo: boolean
  esPropio: boolean
  etiqueta: string
}) {
  const [optimista, setOptimista] = useOptimistic(activo)
  const [, startTransition] = useTransition()

  const cambiar = (valor: boolean) => {
    startTransition(async () => {
      setOptimista(valor)
      aplicarResultado(await cambiarEstadoUsuario(id, valor))
    })
  }

  const control = (
    <Switch
      checked={optimista}
      onCheckedChange={cambiar}
      disabled={esPropio}
      aria-label={`${optimista ? 'Desactivar' : 'Activar'} a ${etiqueta}`}
    />
  )
  if (!esPropio) return control
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* El span recibe el foco y el hover: un botón deshabilitado no dispara eventos. */}
        <span tabIndex={0} className="inline-flex rounded-full focus-visible:ring-2">
          {control}
        </span>
      </TooltipTrigger>
      <TooltipContent>{MENSAJES_REGLA.propioEstado}</TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------------------------------ */

function CampoRol({
  form,
  opciones,
  deshabilitado,
  ayuda,
}: {
  form: Formulario<{ role: string }>
  opciones: readonly Rol[]
  deshabilitado?: boolean
  ayuda?: string
}) {
  const error = form.formState.errors.role
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="role" className="text-sm text-slate-600">
        Rol
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <NativeSelect
        id="role"
        className="w-full"
        disabled={deshabilitado}
        aria-describedby={ayuda ? 'role-ayuda' : undefined}
        {...form.register('role')}
      >
        {opciones.map((r) => (
          <NativeSelectOption key={r} value={r}>
            {ETIQUETA_ROL[r]} ({r})
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {ayuda && (
        <p id="role-ayuda" className="text-xs text-gray-500">
          {ayuda}
        </p>
      )}
      <FieldError errors={[error]} />
    </Field>
  )
}

/** Foto de un usuario (en alta o edición): sube a Blob y deja la URL en el formulario. */
function CampoImagen({ form }: { form: Formulario<{ image?: string | null }> }) {
  const imagen = useWatch({ control: form.control, name: 'image' })
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, startTransition] = useTransition()

  const subir = (archivo?: File) => {
    if (!archivo) return
    startTransition(async () => {
      try {
        form.setValue('image', await subirArchivo('avatar', archivo), { shouldDirty: true })
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-4 md:col-span-2">
      <Image
        src={imagen || '/isotipouno.png'}
        alt="Foto de perfil"
        width={64}
        height={64}
        className="size-16 rounded-full border bg-white object-cover"
      />
      <Button
        type="button"
        variant="outline"
        disabled={subiendo}
        onClick={() => input.current?.click()}
      >
        {subiendo ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Camera aria-hidden="true" />
        )}
        {imagen ? 'Cambiar foto' : 'Subir foto (opcional)'}
      </Button>
      {imagen && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => form.setValue('image', null, { shouldDirty: true })}
        >
          <Trash2 aria-hidden="true" /> Quitar
        </Button>
      )}
      <span className="text-xs text-gray-500">{SUBIDAS.avatar.descripcion}</span>
      <input
        ref={input}
        type="file"
        accept={SUBIDAS.avatar.extensiones}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => subir(e.target.files?.[0])}
      />
    </div>
  )
}

function CamposCliente({ form }: { form: Formulario<CrearUsuarioInput> }) {
  return (
    <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-brand-green bg-brand-green/10 p-4 md:col-span-2 md:grid-cols-2">
      <legend className="px-2 font-semibold text-brand-blue">Datos del cliente</legend>
      <CampoTexto form={form} nombre="company" etiqueta="Empresa" />
      <CampoTexto
        form={form}
        nombre="companyRUT"
        etiqueta="RUT empresa"
        placeholder="12.345.678-9"
      />
      <CampoTexto form={form} nombre="companyEmail" etiqueta="Correo empresa" type="email" />
      <CampoTexto form={form} nombre="companyPhone" etiqueta="Teléfono empresa" type="tel" />
      <CampoTexto
        form={form}
        nombre="driveURL"
        etiqueta="Link de Google Drive"
        type="url"
        placeholder="https://drive.google.com/…"
        className="md:col-span-2"
        descripcion="Carpeta que el cliente verá como «Biblioteca digital»."
      />
    </fieldset>
  )
}

function CamposPersonales({
  form,
  claveRequerida,
}: {
  form: Formulario<CrearUsuarioInput>
  claveRequerida: boolean
}) {
  return (
    <>
      <CampoTexto form={form} nombre="name" etiqueta="Nombre" requerido />
      <CampoTexto form={form} nombre="lastname" etiqueta="Apellido" requerido />
      <CampoTexto
        form={form}
        nombre="username"
        etiqueta="Nombre de usuario"
        requerido
        placeholder="usuario123"
        autoComplete="off"
      />
      <CampoTexto
        form={form}
        nombre="phone"
        etiqueta="Teléfono"
        type="tel"
        placeholder="+56 9 1234 5678"
      />
      <CampoTexto
        form={form}
        nombre="email"
        etiqueta="Correo electrónico"
        requerido
        type="email"
        placeholder="correo@ejemplo.cl"
        className="md:col-span-2"
        autoComplete="off"
      />
      <CampoTexto
        form={form}
        nombre="password"
        etiqueta={claveRequerida ? 'Contraseña' : 'Restablecer contraseña'}
        requerido={claveRequerida}
        type="password"
        autoComplete="new-password"
        placeholder={claveRequerida ? '••••••••' : 'Dejar en blanco para no cambiar'}
        descripcion="Mínimo 8 caracteres."
      />
    </>
  )
}

export type PrecargaUsuario = Partial<
  Pick<CrearUsuarioInput, 'name' | 'lastname' | 'email' | 'phone'>
> & {
  role?: 'TEAM' | 'CLIENT'
}

/** Alta de usuario (único formulario del sistema, reemplaza a /auth/register y al modal). */
export function FormularioNuevoUsuario({ precarga }: { precarga?: PrecargaUsuario }) {
  const router = useRouter()
  const form = useForm<CrearUsuarioInput, unknown, CrearUsuarioOutput>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      name: '',
      lastname: '',
      username: '',
      phone: '',
      email: '',
      password: '',
      role: 'CLIENT',
      company: '',
      companyEmail: '',
      companyPhone: '',
      companyRUT: '',
      driveURL: '',
      image: null,
      ...precarga,
    },
  })
  const rol = useWatch({ control: form.control, name: 'role' })
  const [confirmacion, setConfirmacion] = useState('')
  const [errorConfirmacion, setErrorConfirmacion] = useState<string>()
  const [guardando, startTransition] = useTransition()

  const onSubmit = form.handleSubmit((datos) => {
    if (confirmacion !== form.getValues('password')) {
      setErrorConfirmacion('Las contraseñas no coinciden')
      return
    }
    setErrorConfirmacion(undefined)
    startTransition(async () => {
      const resultado = await crearUsuario(datos)
      if (aplicarResultado(resultado, form)) {
        router.push(rol === 'CLIENT' ? '/dashboard/clientes' : '/dashboard/usuarios')
      }
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CampoImagen form={form as unknown as Formulario<{ image?: string | null }>} />
      <CamposPersonales form={form} claveRequerida />
      <Field data-invalid={Boolean(errorConfirmacion)}>
        <FieldLabel htmlFor="confirmPassword" className="text-sm text-slate-600">
          Confirmar contraseña
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          aria-invalid={Boolean(errorConfirmacion)}
        />
        <FieldError errors={[errorConfirmacion ? { message: errorConfirmacion } : undefined]} />
      </Field>
      <CampoRol
        form={form as unknown as Formulario<{ role: string }>}
        opciones={['TEAM', 'CLIENT']}
        ayuda="Los administradores solo se crean por script, no desde el panel."
      />
      {rol === 'CLIENT' && <CamposCliente form={form} />}
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando} className="bg-brand-blue hover:bg-brand-blue/90">
          {guardando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {guardando ? 'Registrando…' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

export type ValoresEdicion = Omit<EditarUsuarioInput, 'password'>

/** Edición de otro usuario por ADMIN. El rol propio no se puede cambiar. */
export function FormularioEditarUsuario({
  id,
  valores,
  esPropio,
}: {
  id: number
  valores: ValoresEdicion
  esPropio: boolean
}) {
  const router = useRouter()
  const form = useForm<EditarUsuarioInput, unknown, EditarUsuarioOutput>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: { ...valores, password: '' },
  })
  const rol = useWatch({ control: form.control, name: 'role' })
  const [guardando, startTransition] = useTransition()

  const onSubmit = form.handleSubmit((datos) => {
    startTransition(async () => {
      const resultado = await editarUsuario(id, datos)
      if (aplicarResultado(resultado, form)) form.reset({ ...form.getValues(), password: '' })
    })
  })

  const opciones: readonly Rol[] =
    valores.role === 'ADMIN' ? ['ADMIN', 'TEAM', 'CLIENT'] : ['TEAM', 'CLIENT']

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CampoImagen form={form as unknown as Formulario<{ image?: string | null }>} />
      <CamposPersonales
        form={form as unknown as Formulario<CrearUsuarioInput>}
        claveRequerida={false}
      />
      <CampoRol
        form={form as unknown as Formulario<{ role: string }>}
        opciones={opciones}
        deshabilitado={esPropio}
        ayuda={esPropio ? MENSAJES_REGLA.propioRol : undefined}
      />
      {rol === 'CLIENT' && (
        <CamposCliente form={form as unknown as Formulario<CrearUsuarioInput>} />
      )}
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/usuarios')}>
          Volver
        </Button>
        <Button type="submit" disabled={guardando} className="bg-brand-blue hover:bg-brand-blue/90">
          {guardando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

/** Borrado físico con doble confirmación (diálogo + escribir el correo). */
export function EliminarUsuario({ id, email }: { id: number; email: string }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [pendiente, startTransition] = useTransition()

  return (
    <AlertDialog onOpenChange={() => setTexto('')}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden="true" /> Eliminar definitivamente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este usuario para siempre?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Si solo quieres quitarle el acceso, desactívalo. Para
            confirmar, escribe su correo: <strong className="break-all">{email}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Correo del usuario"
          autoComplete="off"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={texto.trim().toLowerCase() !== email.toLowerCase() || pendiente}
            onClick={(e) => {
              e.preventDefault()
              startTransition(async () => {
                if (aplicarResultado(await eliminarUsuario(id, texto)))
                  router.push('/dashboard/usuarios')
              })
            }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
