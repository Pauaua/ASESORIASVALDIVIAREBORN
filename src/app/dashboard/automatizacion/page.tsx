import { Zap } from 'lucide-react'
import { Automatizacion } from '@/components/dashboard/automatizacion'
import { enSuspense } from '@/components/dashboard/carga'
import { Panel } from '@/components/dashboard/panel'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Automatización' }

/** Automatización SII (ADMIN y TEAM): boletas de honorarios y aceptación de facturas. */
async function AutomatizacionPage() {
  await requirePagina('automatizacion.ejecutar')
  return (
    <Panel
      titulo={
        <span className="flex items-center gap-2">
          <Zap className="size-6" aria-hidden="true" /> AUTOMATIZACIÓN
        </span>
      }
    >
      <Automatizacion />
    </Panel>
  )
}

export default enSuspense(AutomatizacionPage)
