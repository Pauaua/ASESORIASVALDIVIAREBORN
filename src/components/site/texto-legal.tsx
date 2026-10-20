import type { ReactNode } from 'react'
import type { LegalBlock } from '@/content/legal/types'

/** Convierte las URLs y correos del texto en enlaces. */
function enlazar(texto: string): ReactNode[] {
  const partes = texto.split(/(https?:\/\/[^\s,]+[^\s,.)]|[\w.+-]+@[\w-]+\.[\w.]+[a-z])/gi)
  return partes.map((parte, i) => {
    if (/^https?:\/\//i.test(parte)) {
      return (
        <a key={i} href={parte} target="_blank" rel="noopener noreferrer" className="underline">
          {parte}
        </a>
      )
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/i.test(parte)) {
      return (
        <a key={i} href={`mailto:${parte.toLowerCase()}`} className="font-bold underline">
          {parte}
        </a>
      )
    }
    return parte
  })
}

/** Renderiza un texto legal agrupando las viñetas consecutivas en listas. */
export function TextoLegal({ bloques }: { bloques: readonly LegalBlock[] }) {
  const nodos: ReactNode[] = []
  let lista: LegalBlock[] = []

  const cerrarLista = () => {
    if (!lista.length) return
    nodos.push(
      <ul key={`ul-${nodos.length}`} className="mb-4 list-disc space-y-2 pl-6">
        {lista.map((item, i) => (
          <li key={i}>{enlazar(item.text)}</li>
        ))}
      </ul>,
    )
    lista = []
  }

  bloques.forEach((bloque, i) => {
    if (bloque.type === 'li') {
      lista.push(bloque)
      return
    }
    cerrarLista()
    if (bloque.type === 'h2') {
      nodos.push(
        <h2 key={i} className="mt-10 mb-4 text-xl font-bold">
          {bloque.text}
        </h2>,
      )
    } else if (bloque.type === 'h3') {
      nodos.push(
        <h3 key={i} className="mt-6 mb-3 font-bold">
          {bloque.text}
        </h3>,
      )
    } else {
      nodos.push(
        <p key={i} className="mb-4">
          {enlazar(bloque.text)}
        </p>,
      )
    }
  })
  cerrarLista()

  return <div className="text-lg text-brand-blue">{nodos}</div>
}
