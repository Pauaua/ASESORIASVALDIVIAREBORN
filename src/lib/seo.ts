import type { Metadata } from 'next'
import { sitio } from '@/content/sitio'

/**
 * Metadata de una página pública: título (se completa con la plantilla "%s | Asesorías
 * Valdivia"), descripción, canonical y Open Graph coherentes.
 */
export function metadataPagina({
  titulo,
  descripcion,
  ruta,
  imagen,
  tipo = 'website',
}: {
  titulo: string
  descripcion: string
  /** Ruta canónica, p. ej. "/servicios". */
  ruta: string
  imagen?: { url: string; width: number; height: number; alt: string }
  tipo?: 'website' | 'article'
}): Metadata {
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      type: tipo,
      locale: 'es_CL',
      siteName: sitio.nombre,
      url: ruta,
      title: `${titulo} | ${sitio.nombre}`,
      description: descripcion,
      ...(imagen ? { images: [imagen] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} | ${sitio.nombre}`,
      description: descripcion,
    },
  }
}

/** Serializa JSON-LD escapando `<` para evitar inyección de HTML (recomendación de Next). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}
