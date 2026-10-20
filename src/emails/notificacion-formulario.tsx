import { Link, Text } from '@react-email/components'
import { EmailLayout, estilos } from './components/layout'

export type TipoFormulario = 'contacto' | 'cotizacion' | 'solicitud_registro'

export const TITULOS_FORMULARIO: Record<TipoFormulario, string> = {
  contacto: 'Nuevo mensaje de contacto',
  cotizacion: 'Nueva solicitud de cotización',
  solicitud_registro: 'Nueva solicitud de registro de cliente',
}

export type NotificacionFormularioProps = {
  appUrl: string
  tipo: TipoFormulario
  nombre: string
  apellido: string
  correo: string
  telefono?: string
  /** Solo cotización: nombre legible del servicio. */
  servicio?: string
  mensaje: string
}

/** Aviso interno a la bandeja de Asesorías Valdivia por cada formulario recibido. */
export default function NotificacionFormulario(props: NotificacionFormularioProps) {
  const titulo = TITULOS_FORMULARIO[props.tipo]
  const filas: [string, string][] = [
    ['Nombre', `${props.nombre} ${props.apellido}`],
    ['Correo', props.correo],
    ['Teléfono', props.telefono || 'No indicado'],
    ...(props.servicio ? ([['Servicio a cotizar', props.servicio]] as [string, string][]) : []),
    ['Mensaje', props.mensaje],
  ]

  return (
    <EmailLayout preview={`${titulo}: ${props.nombre} ${props.apellido}`} appUrl={props.appUrl}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta}>
          <Text style={estilos.etiqueta}>{etiqueta}</Text>
          <Text style={estilos.valor}>{valor}</Text>
        </div>
      ))}
      <Text style={estilos.parrafo}>
        Puedes responder directamente a este correo para contestarle a {props.nombre}. También quedó
        guardado en la{' '}
        <Link href={`${props.appUrl}/dashboard/mensajes`}>bandeja de mensajes del panel</Link>.
      </Text>
    </EmailLayout>
  )
}

NotificacionFormulario.PreviewProps = {
  appUrl: 'http://localhost:3000',
  tipo: 'cotizacion',
  nombre: 'María',
  apellido: 'González',
  correo: 'maria@ejemplo.cl',
  telefono: '912345678',
  servicio: 'Asesoría Contable',
  mensaje: 'Hola, quisiera cotizar la contabilidad mensual de mi pyme.',
} satisfies NotificacionFormularioProps
