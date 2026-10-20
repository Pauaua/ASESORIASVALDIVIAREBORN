import { notFound } from 'next/navigation'
import { enSuspense } from '@/components/dashboard/carga'
import { EditorNoticia } from '@/components/dashboard/noticias'
import { Panel } from '@/components/dashboard/panel'
import { obtenerNoticia } from '@/lib/data/noticias'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Editar noticia' }

async function EditarNoticiaPage({ params }: PageProps<'/dashboard/noticias/[id]'>) {
  await requirePagina('noticias.administrar')
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const n = await obtenerNoticia(id)
  if (!n) notFound()

  return (
    <Panel titulo="EDITAR NOTICIA">
      <EditorNoticia
        id={n.id}
        valores={{
          title: n.title,
          slug: n.slug,
          publishedAt: n.publishedAt.toISOString().slice(0, 10),
          image: n.image,
          imageAlt: n.imageAlt ?? '',
          excerpt: n.excerpt,
          content: n.content,
          sources: n.sources.join('\n'),
          published: n.published,
        }}
      />
    </Panel>
  )
}

export default enSuspense(EditarNoticiaPage)
