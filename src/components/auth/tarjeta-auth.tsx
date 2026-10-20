import Image from 'next/image'
import type { ReactNode } from 'react'
import { FondoDegradado } from '@/components/site/fondo-degradado'
import { NavbarSpacer } from '@/components/site/navbar'

/** Tarjeta blanca centrada sobre el fondo degradado, con el isotipo, para las páginas de acceso. */
export function TarjetaAuth({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <>
      <NavbarSpacer />
      <FondoDegradado className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex justify-center">
            <Image src="/isotipodos.png" alt="" width={150} height={150} />
          </div>
          <h1 className="mb-6 text-center text-2xl font-bold text-brand-blue">{titulo}</h1>
          {children}
        </div>
      </FondoDegradado>
    </>
  )
}
