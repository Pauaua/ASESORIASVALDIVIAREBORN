import { Text } from '@react-email/components'
import { EmailLayout, estilos } from './components/layout'

export type CorreoPruebaProps = { appUrl: string; fecha: string }

/** Correo de prueba enviado desde "Estado del sistema". */
export default function CorreoPrueba({ appUrl, fecha }: CorreoPruebaProps) {
  return (
    <EmailLayout preview="Correo de prueba del panel" appUrl={appUrl}>
      <Text style={estilos.titulo}>Correo de prueba</Text>
      <Text style={estilos.parrafo}>
        Si estás leyendo esto, el envío de correos del sitio funciona correctamente.
      </Text>
      <Text style={estilos.parrafo}>Enviado el {fecha}.</Text>
    </EmailLayout>
  )
}

CorreoPrueba.PreviewProps = {
  appUrl: 'http://localhost:3000',
  fecha: '20-10-2026, 15:30',
} satisfies CorreoPruebaProps
