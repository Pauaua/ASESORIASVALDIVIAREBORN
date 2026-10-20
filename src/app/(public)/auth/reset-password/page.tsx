import Link from 'next/link'
import { Suspense } from 'react'
import { FormularioRestablecer } from '@/components/auth/formularios-auth'
import { TarjetaAuth } from '@/components/auth/tarjeta-auth'

export const metadata = {
  title: 'Restablecer contraseña',
  robots: { index: false, follow: false },
}

async function Formulario({
  searchParams,
}: {
  searchParams: PageProps<'/auth/reset-password'>['searchParams']
}) {
  const { token } = await searchParams
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return (
      <div className="space-y-4 text-center">
        <p role="alert" className="text-red-700">
          El enlace no es válido o está incompleto.
        </p>
        <Link href="/auth/forgot-password" className="text-brand-blue hover:underline">
          Solicitar un nuevo enlace
        </Link>
      </div>
    )
  }
  return <FormularioRestablecer token={token} />
}

export default function ResetPasswordPage({ searchParams }: PageProps<'/auth/reset-password'>) {
  return (
    <TarjetaAuth titulo="Restablecer Contraseña">
      <Suspense fallback={<p className="text-center text-gray-500">Cargando…</p>}>
        <Formulario searchParams={searchParams} />
      </Suspense>
    </TarjetaAuth>
  )
}
