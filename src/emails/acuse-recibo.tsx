import { Link, Text } from '@react-email/components'
import { sitio } from '@/content/sitio'
import { EmailLayout, estilos } from './components/layout'
import type { TipoFormulario } from './notificacion-formulario'

const MOTIVO: Record<TipoFormulario, string> = {
  contacto: 'tu mensaje',
  cotizacion: 'tu solicitud de cotización',
  solicitud_registro: 'tu solicitud de registro como cliente',
}

export type AcuseReciboProps = {
  appUrl: string
  tipo: TipoFormulario
  nombre: string
}

/** Confirmación al visitante de que su formulario llegó. */
export default function AcuseRecibo({ appUrl, tipo, nombre }: AcuseReciboProps) {
  return (
    <EmailLayout preview={`Recibimos ${MOTIVO[tipo]}`} appUrl={appUrl}>
      <Text style={estilos.titulo}>¡Hola, {nombre}!</Text>
      <Text style={estilos.parrafo}>
        Gracias por escribirnos. Recibimos {MOTIVO[tipo]} y te responderemos a la brevedad.
      </Text>
      <Text style={estilos.parrafo}>
        Si tu consulta es urgente, puedes escribirnos por WhatsApp al {sitio.telefonoVisible} o al
        correo <Link href={`mailto:${sitio.email}`}>{sitio.email}</Link>.
      </Text>
      <Text style={estilos.parrafo}>
        Saludos cordiales,
        <br />
        Equipo {sitio.nombre}
      </Text>
    </EmailLayout>
  )
}

AcuseRecibo.PreviewProps = {
  appUrl: 'http://localhost:3000',
  tipo: 'contacto',
  nombre: 'María',
} satisfies AcuseReciboProps
