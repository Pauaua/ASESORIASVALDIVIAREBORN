import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown de las noticias. No interpreta HTML (react-markdown lo ignora por defecto) y solo deja
 * enlaces http(s)/mailto: el contenido es seguro aunque venga de la base.
 */
const componentes: Components = {
  h1: ({ children }) => (
    <h2 className="mt-8 mb-3 text-2xl font-bold text-brand-blue">{children}</h2>
  ),
  h2: ({ children }) => <h2 className="mt-8 mb-3 text-xl font-bold text-brand-blue">{children}</h2>,
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-brand-blue">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-brand-green pl-4 italic">{children}</blockquote>
  ),
  a: ({ href, children }) => {
    const seguro = href && /^(https?:|mailto:)/i.test(href) ? href : undefined
    return seguro ? (
      <a
        href={seguro}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-blue underline"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    )
  },
  // Las imágenes del cuerpo no se renderizan: la noticia tiene su imagen principal.
  img: () => null,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border bg-gray-50 px-2 py-1 text-left">{children}</th>,
  td: ({ children }) => <td className="border px-2 py-1">{children}</td>,
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
      {children}
    </ReactMarkdown>
  )
}
