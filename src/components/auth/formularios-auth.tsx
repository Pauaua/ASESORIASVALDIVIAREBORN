'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  iniciarSesion,
  restablecerClave,
  solicitarRecuperacion,
  type ResultadoAuth,
} from '@/lib/actions/auth'
import {
  loginSchema,
  recuperarClaveSchema,
  restablecerClaveSchema,
  type LoginInput,
  type RecuperarClaveInput,
  type RestablecerClaveInput,
} from '@/lib/validators/auth'
import { cn } from '@/lib/utils'

const campoCls = 'h-11 bg-brand-white text-base text-brand-blue md:text-base'
const etiquetaCls = 'text-sm text-slate-500'

/** Mensaje de resultado (éxito o error) anunciado a lectores de pantalla y enfocado. */
function Aviso({ resultado }: { resultado: ResultadoAuth | null }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (resultado) ref.current?.focus()
  }, [resultado])
  if (!resultado) return null
  const texto = resultado.ok ? resultado.mensaje : resultado.error
  if (!texto) return null
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={resultado.ok ? 'status' : 'alert'}
      className={cn(
        'rounded p-3 text-center outline-none',
        resultado.ok ? 'bg-green-50 text-green-800' : 'bg-red-600 text-white',
      )}
    >
      {texto}
    </p>
  )
}

type CampoProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  nombre: Path<T>
  etiqueta: string
  children: (aria: Record<string, unknown>) => React.ReactNode
}

function Campo<T extends FieldValues>({ form, nombre, etiqueta, children }: CampoProps<T>) {
  const error = form.formState.errors[nombre]
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={nombre} className={etiquetaCls}>
        {etiqueta}
      </FieldLabel>
      {children({
        id: nombre,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? `${nombre}-error` : undefined,
        ...form.register(nombre),
      })}
      <FieldError id={`${nombre}-error`} errors={[error as { message?: string } | undefined]} />
    </Field>
  )
}

/** Input de contraseña con botón mostrar/ocultar. */
function InputClave({ autoComplete, ...aria }: Record<string, unknown> & { autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        {...aria}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder="**********"
        className={cn(campoCls, 'pr-11')}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center rounded px-3 text-gray-500 focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}

function BotonEnviar({ enviando, children }: { enviando: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      disabled={enviando}
      className="h-12 w-full rounded-lg bg-brand-blue text-base text-white hover:bg-brand-green hover:text-brand-blue"
    >
      {enviando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  )
}

export function FormularioLogin({ callbackUrl, error }: { callbackUrl?: string; error?: string }) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const [enviando, startTransition] = useTransition()
  const [resultado, setResultado] = useState<ResultadoAuth | null>(
    error ? { ok: false, error } : null,
  )

  const onSubmit = form.handleSubmit((valores) => {
    setResultado(null)
    startTransition(async () => {
      // Si el login es correcto, la acción redirige y no vuelve.
      const respuesta = await iniciarSesion(valores, callbackUrl)
      if (!respuesta.ok) {
        setResultado(respuesta)
        form.resetField('password')
      }
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Aviso resultado={resultado} />
      <Campo form={form} nombre="email" etiqueta="Correo electrónico:">
        {(aria) => (
          <Input
            {...aria}
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.cl"
            className={campoCls}
          />
        )}
      </Campo>
      <Campo form={form} nombre="password" etiqueta="Contraseña:">
        {(aria) => <InputClave {...aria} autoComplete="current-password" />}
      </Campo>
      <BotonEnviar enviando={enviando}>INICIAR SESIÓN</BotonEnviar>
      <p className="text-center">
        <Link href="/auth/forgot-password" className="text-sm text-brand-blue hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  )
}

export function FormularioRecuperar() {
  const form = useForm<RecuperarClaveInput>({
    resolver: zodResolver(recuperarClaveSchema),
    defaultValues: { email: '' },
  })
  const [enviando, startTransition] = useTransition()
  const [resultado, setResultado] = useState<ResultadoAuth | null>(null)

  const onSubmit = form.handleSubmit((valores) => {
    setResultado(null)
    startTransition(async () => {
      const respuesta = await solicitarRecuperacion(valores)
      setResultado(respuesta)
      if (respuesta.ok) form.reset()
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Campo form={form} nombre="email" etiqueta="Correo electrónico:">
        {(aria) => (
          <Input
            {...aria}
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.cl"
            className={campoCls}
          />
        )}
      </Campo>
      <BotonEnviar enviando={enviando}>Recuperar contraseña</BotonEnviar>
      <Aviso resultado={resultado} />
      <p className="text-center">
        <Link href="/auth/login" className="text-sm text-brand-blue hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  )
}

export function FormularioRestablecer({ token }: { token: string }) {
  const router = useRouter()
  const form = useForm<RestablecerClaveInput>({
    resolver: zodResolver(restablecerClaveSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  })
  const [enviando, startTransition] = useTransition()
  const [resultado, setResultado] = useState<ResultadoAuth | null>(null)

  const onSubmit = form.handleSubmit((valores) => {
    setResultado(null)
    startTransition(async () => {
      const respuesta = await restablecerClave(valores)
      setResultado(respuesta)
      if (respuesta.ok) setTimeout(() => router.push('/auth/login'), 3000)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Campo form={form} nombre="password" etiqueta="Nueva contraseña:">
        {(aria) => <InputClave {...aria} autoComplete="new-password" />}
      </Campo>
      <Campo form={form} nombre="confirmPassword" etiqueta="Confirmar contraseña:">
        {(aria) => <InputClave {...aria} autoComplete="new-password" />}
      </Campo>
      <BotonEnviar enviando={enviando || resultado?.ok === true}>
        Restablecer contraseña
      </BotonEnviar>
      <Aviso resultado={resultado} />
    </form>
  )
}
