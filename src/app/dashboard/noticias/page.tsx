import { ExternalLink, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { enSuspense } from '@/components/dashboard/carga'
import { EliminarNoticia, SwitchPublicada } from '@/components/dashboard/noticias'
import { Panel, Vacio } from '@/components/dashboard/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listarNoticiasAdmin } from '@/lib/data/noticias'
import { formatearFecha } from '@/lib/fechas'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Noticias' }

async function NoticiasPanelPage() {
  await requirePagina('noticias.administrar')
  const noticias = await listarNoticiasAdmin()

  return (
    <Panel
      titulo="NOTICIAS"
      acciones={
        <Link
          href="/dashboard/noticias/nueva"
          className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-4 py-2 text-sm text-white transition-colors hover:bg-brand-green hover:text-brand-blue"
        >
          <Plus className="size-4" aria-hidden="true" /> Nueva noticia
        </Link>
      }
    >
      {noticias.length === 0 ? (
        <Vacio>No hay noticias. Crea la primera.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Título</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Publicada</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noticias.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="max-w-md whitespace-normal">
                  <Link
                    href={`/dashboard/noticias/${n.id}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {n.title}
                  </Link>
                </TableCell>
                <TableCell>{formatearFecha(n.publishedAt)}</TableCell>
                <TableCell>
                  {n.author ? `${n.author.name} ${n.author.lastname}` : 'Asesorías Valdivia'}
                </TableCell>
                <TableCell>
                  <SwitchPublicada id={n.id} publicada={n.published} titulo={n.title} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/noticias/${n.id}`}
                      aria-label={`Editar «${n.title}»`}
                      className="rounded p-1.5 hover:bg-gray-100"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    {n.published && (
                      <a
                        href={`/noticias/${n.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver «${n.title}» en el sitio`}
                        className="rounded p-1.5 hover:bg-gray-100"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    )}
                    <EliminarNoticia id={n.id} titulo={n.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}

export default enSuspense(NoticiasPanelPage)
