import { enSuspense } from '@/components/dashboard/carga'
import { EditorNoticia } from '@/components/dashboard/noticias'
import { Panel } from '@/components/dashboard/panel'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Nueva noticia' }

async function NuevaNoticiaPage() {
  await requirePagina('noticias.administrar')
  return (
    <Panel titulo="NUEVA NOTICIA">
      <EditorNoticia />
    </Panel>
  )
}

export default enSuspense(NuevaNoticiaPage)
