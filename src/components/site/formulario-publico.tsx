'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { servicios } from '@/content/servicios'
import {
  enviarContacto,
  enviarCotizacion,
  type ResultadoFormulario,
} from '@/lib/actions/formularios'
import {
  contactoSchema,
  cotizacionSchema,
  type CotizacionInput,
  type Origen,
} from '@/lib/validators/formularios'
import { Turnstile } from './turnstile'

type Props = { tipo: 'contacto'; origen: Origen } | { tipo: 'cotizacion'; origen?: never }

type Valores = CotizacionInput

const campoCls = 'h-10 bg-white text-base md:text-base'
const etiquetaCls = 'text-sm font-medium text-brand-blue sm:text-base'

const MENSAJE_EXITO = 'Formulario enviado con éxito. Gracias por contactarnos.'

/**
 * Formulario público (contacto, solicitud de registro o cotización). Valida con el mismo
 * esquema Zod que el servidor y envía con una Server Action.
 */
export function FormularioPublico(props: Props) {
  const esCotizacion = props.tipo === 'cotizacion'
  const form = useForm<Valores>({
    // El esquema de contacto es el de cotización sin `servicio`.
    resolver: zodResolver(
      (esCotizacion ? cotizacionSchema : contactoSchema) as typeof cotizacionSchema,
    ),
    defaultValues: { nombre: '', apellido: '', correo: '', telefono: '', mensaje: '' },
    mode: 'onTouched',
  })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form

  const [enviando, startTransition] = useTransition()
  const [resultado, setResultado] = useState<ResultadoFormulario | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>()
  const cargadoEn = useRef(0)
  const honeypot = useRef<HTMLInputElement>(null)
  const estadoRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    cargadoEn.current = Date.now()
  }, [])

  const enviar = (valores: Valores) => {
    setResultado(null)
    startTransition(async () => {
      const antiSpam = {
        sitioWeb: honeypot.current?.value ?? '',
        cargadoEn: cargadoEn.current,
        turnstileToken,
      }
      const respuesta = esCotizacion
        ? await enviarCotizacion({ ...valores, ...antiSpam })
        : await enviarContacto({ ...valores, origen: props.origen, ...antiSpam })

      if (respuesta.ok) {
        reset()
      } else if (respuesta.fieldErrors) {
        for (const [campo, mensajes] of Object.entries(respuesta.fieldErrors)) {
          if (mensajes?.[0]) setError(campo as Path<Valores>, { message: mensajes[0] })
        }
      }
      setResultado(respuesta)
      requestAnimationFrame(() => estadoRef.current?.focus())
    })
  }

  // handleSubmit se invoca en el evento (no en el render) porque `enviar` lee refs.
  const onSubmit = (evento: React.FormEvent<HTMLFormElement>) => handleSubmit(enviar)(evento)

  const campo = (
    nombre: Path<Valores>,
    etiqueta: string,
    control: React.ReactNode,
    requerido = true,
  ) => (
    <Field data-invalid={Boolean(errors[nombre])}>
      <FieldLabel htmlFor={nombre} className={etiquetaCls}>
        {etiqueta}
        {requerido && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLabel>
      {control}
      <FieldError id={`${nombre}-error`} errors={[errors[nombre]]} />
    </Field>
  )

  const aria = (nombre: Path<Valores>) => ({
    id: nombre,
    'aria-invalid': Boolean(errors[nombre]),
    'aria-describedby': errors[nombre] ? `${nombre}-error` : undefined,
  })

  return (
    <div className="mx-auto max-w-2xl rounded-xl p-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <p className="text-sm text-brand-blue/80">
          Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
        </p>
        {campo(
          'nombre',
          'Nombre:',
          <Input
            {...register('nombre')}
            {...aria('nombre')}
            autoComplete="given-name"
            className={campoCls}
          />,
        )}
        {campo(
          'apellido',
          'Apellido:',
          <Input
            {...register('apellido')}
            {...aria('apellido')}
            autoComplete="family-name"
            className={campoCls}
          />,
        )}
        {campo(
          'correo',
          'Correo:',
          <Input
            type="email"
            {...register('correo')}
            {...aria('correo')}
            autoComplete="email"
            className={campoCls}
          />,
        )}
        {campo(
          'telefono',
          'Teléfono:',
          <Input
            type="tel"
            inputMode="numeric"
            {...register('telefono')}
            {...aria('telefono')}
            autoComplete="tel"
            className={campoCls}
          />,
          false,
        )}
        {esCotizacion &&
          campo(
            'servicio',
            '¿Qué servicio deseas cotizar?',
            <NativeSelect
              {...register('servicio')}
              {...aria('servicio')}
              defaultValue=""
              className="w-full"
            >
              <NativeSelectOption value="" disabled>
                Selecciona una opción:
              </NativeSelectOption>
              {servicios.map((servicio) => (
                <NativeSelectOption key={servicio.id} value={servicio.id}>
                  {servicio.opcionCotizacion}
                </NativeSelectOption>
              ))}
            </NativeSelect>,
          )}
        {campo(
          'mensaje',
          'Mensaje:',
          <Textarea
            rows={4}
            {...register('mensaje')}
            {...aria('mensaje')}
            className="bg-white text-base md:text-base"
          />,
        )}

        {/* Honeypot: invisible para personas, los bots suelen rellenarlo. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor="sitioWeb">No completar este campo</label>
          <input
            ref={honeypot}
            id="sitioWeb"
            name="sitioWeb"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Turnstile onToken={setTurnstileToken} />

        <div className="flex items-center gap-2">
          <Image
            src="/flechaazulderecha.png"
            alt=""
            width={58}
            height={70}
            className="h-auto w-10 sm:w-14 md:w-[58px]"
          />
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center rounded-full bg-brand-blue px-4 py-1.5 text-sm font-medium text-brand-white shadow-sm transition-colors hover:bg-brand-white hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70 sm:py-2 sm:text-base md:text-lg"
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>

      <p
        ref={estadoRef}
        tabIndex={-1}
        role="status"
        className={
          resultado?.ok
            ? 'mt-4 font-bold text-green-700 outline-none sm:text-base'
            : 'mt-4 text-red-700 outline-none sm:text-base'
        }
      >
        {resultado ? (resultado.ok ? MENSAJE_EXITO : resultado.error) : null}
      </p>
    </div>
  )
}
