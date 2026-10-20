import Image from 'next/image'
import Link from 'next/link'
import { enSuspense } from '@/components/dashboard/carga'
import { Panel } from '@/components/dashboard/panel'
import { servicios } from '@/content/servicios'
import { requirePagina } from '@/lib/session'

export const metadata = { title: 'Servicios' }

/** Servicios publicados: mismo contenido que el sitio (src/content/servicios.ts). */
async function ServiciosPanelPage() {
  await requirePagina('servicios.ver')
  return (
    <Panel
      titulo="SERVICIOS PUBLICADOS"
      acciones={
        <Link href="/servicios" className="text-sm text-brand-blue hover:underline">
          Ver en el sitio
        </Link>
      }
    >
      <p className="mb-6 text-sm text-gray-500">
        El contenido de los servicios se edita en <code>src/content/servicios.ts</code> y se refleja
        en el sitio público y en este panel.
      </p>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {servicios.map((s) => (
          <li key={s.id} className="rounded-lg bg-blue-50 p-4">
            <Image
              src={s.imagen.src}
              alt=""
              width={s.imagen.width}
              height={s.imagen.height}
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 40vw, 90vw"
              className="mb-3 h-auto w-full rounded"
            />
            <h2 className="mb-2 text-lg font-semibold text-brand-blue">{s.titulo}</h2>
            <p className="mb-4 text-sm text-gray-600">{s.descripcion}</p>
            {s.precio && <p className="font-bold text-brand-blue">{s.precio}</p>}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export default enSuspense(ServiciosPanelPage)
