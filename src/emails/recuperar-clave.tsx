import { Button, Text } from '@react-email/components'
import { EmailLayout, colores, estilos } from './components/layout'

export type RecuperarClaveProps = {
  appUrl: string
  nombre: string
  enlace: string
}

/** Enlace para restablecer la contraseña (válido por 1 hora). */
export default function RecuperarClave({ appUrl, nombre, enlace }: RecuperarClaveProps) {
  return (
    <EmailLayout preview="Restablece tu contraseña de Asesorías Valdivia" appUrl={appUrl}>
      <Text style={estilos.titulo}>Hola, {nombre}</Text>
      <Text style={estilos.parrafo}>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón
        para elegir una nueva. El enlace es válido por 1 hora.
      </Text>
      <Button
        href={enlace}
        style={{
          backgroundColor: colores.azul,
          borderRadius: 8,
          color: '#ffffff',
          display: 'inline-block',
          fontSize: 15,
          fontWeight: 600,
          margin: '8px 0 20px',
          padding: '12px 24px',
        }}
      >
        Restablecer contraseña
      </Button>
      <Text style={{ ...estilos.parrafo, color: colores.gris, fontSize: 13 }}>
        Si el botón no funciona, copia este enlace en tu navegador: {enlace}
      </Text>
      <Text style={{ ...estilos.parrafo, color: colores.gris, fontSize: 13 }}>
        Si no solicitaste este cambio, puedes ignorar este correo: tu contraseña no cambiará.
      </Text>
    </EmailLayout>
  )
}

RecuperarClave.PreviewProps = {
  appUrl: 'http://localhost:3000',
  nombre: 'María',
  enlace: 'http://localhost:3000/auth/reset-password?token=abc123',
} satisfies RecuperarClaveProps
