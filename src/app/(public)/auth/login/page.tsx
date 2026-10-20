import { Suspense } from 'react'
import { FormularioLogin } from '@/components/auth/formularios-auth'
import { TarjetaAuth } from '@/components/auth/tarjeta-auth'
import { metadataPagina } from '@/lib/seo'

export const metadata = {
  ...metadataPagina({
    titulo: 'Iniciar sesión',
    descripcion: 'Accede al panel de usuario de Asesorías Valdivia.',
    ruta: '/auth/login',
  }),
  robots: { index: false, follow: true },
}

/** Errores que Auth.js puede devolver en ?error= (no hay página /auth/error). */
const ERRORES: Record<string, string> = {
  CredentialsSignin: 'Correo o contraseña incorrectos.',
  SessionRequired: 'Inicia sesión para continuar.',
}

async function Formulario({
  searchParams,
}: {
  searchParams: PageProps<'/auth/login'>['searchParams']
}) {
  const { callbackUrl, error } = await searchParams
  const mensajeError =
    typeof error === 'string'
      ? (ERRORES[error] ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.')
      : undefined
  return (
    <FormularioLogin
      callbackUrl={typeof callbackUrl === 'string' ? callbackUrl : undefined}
      error={mensajeError}
    />
  )
}

export default function LoginPage({ searchParams }: PageProps<'/auth/login'>) {
  return (
    <TarjetaAuth titulo="Iniciar sesión">
      <Suspense fallback={<FormularioLogin />}>
        <Formulario searchParams={searchParams} />
      </Suspense>
    </TarjetaAuth>
  )
}
