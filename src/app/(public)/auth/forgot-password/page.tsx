import { FormularioRecuperar } from '@/components/auth/formularios-auth'
import { TarjetaAuth } from '@/components/auth/tarjeta-auth'
import { metadataPagina } from '@/lib/seo'

export const metadata = {
  ...metadataPagina({
    titulo: 'Recuperar contraseña',
    descripcion: 'Recupera el acceso a tu cuenta de Asesorías Valdivia.',
    ruta: '/auth/forgot-password',
  }),
  robots: { index: false, follow: true },
}

export default function ForgotPasswordPage() {
  return (
    <TarjetaAuth titulo="Recuperar Contraseña">
      <FormularioRecuperar />
    </TarjetaAuth>
  )
}
