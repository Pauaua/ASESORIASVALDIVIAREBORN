/**
 * Carga en la tabla "Post" las 6 noticias del sitio anterior (src/content/noticias.ts), con sus
 * fuentes. Es idempotente: si ya existe una noticia con el mismo slug, no la toca (así no pisa
 * ediciones hechas desde el panel).
 *
 * Uso:
 *   npm run noticias:sembrar                    # usa DATABASE_URL de .env
 *   npm run noticias:sembrar -- --url "<url>"   # otra base (p. ej. Railway)
 */
import { noticias } from '../src/content/noticias'
import { createScriptPrisma } from './lib/prisma'

const prisma = createScriptPrisma()

/** Primer párrafo recortado a ~200 caracteres sin cortar palabras. */
function extracto(texto: string) {
  if (texto.length <= 200) return texto
  return `${texto.slice(0, 200).replace(/\s+\S*$/, '')}…`
}

async function main() {
  let creadas = 0
  for (const n of noticias) {
    const existe = await prisma.post.findUnique({ where: { slug: n.slug }, select: { id: true } })
    if (existe) continue
    await prisma.post.create({
      data: {
        slug: n.slug,
        title: n.titulo,
        publishedAt: new Date(`${n.fecha}T12:00:00Z`),
        image: n.imagen.src,
        imageAlt: null,
        excerpt: extracto(n.parrafos[0] ?? n.titulo),
        content: n.parrafos.join('\n\n'),
        sources: n.fuentes,
        published: true,
      },
    })
    creadas++
  }
  console.log(`Noticias creadas: ${creadas} (ya existían: ${noticias.length - creadas}).`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
