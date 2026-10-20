'use client'

import { LoaderCircle, Send } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { enviarCorreoPrueba } from '@/lib/actions/sistema'
import { aplicarResultado } from './formulario'

export function BotonCorreoPrueba({ habilitado }: { habilitado: boolean }) {
  const [pendiente, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!habilitado || pendiente}
      onClick={() => startTransition(async () => void aplicarResultado(await enviarCorreoPrueba()))}
    >
      {pendiente ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Send aria-hidden="true" />
      )}
      Enviar correo de prueba
    </Button>
  )
}
