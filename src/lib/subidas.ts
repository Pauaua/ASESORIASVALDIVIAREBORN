import type { Permiso } from '@/lib/rbac'

/**
 * Tipos de archivo que se suben a Vercel Blob directo desde el navegador (sin pasar por la
 * función, que en Vercel tiene un límite de 4,5 MB por request). El servidor firma el token solo
 * si la sesión tiene el permiso, y limita tipo y tamaño.
 *
 * Módulo puro: lo usan el cliente (validación previa) y el Route Handler.
 */
export const SUBIDAS = {
  avatar: {
    carpeta: 'avatars',
    tipos: ['image/jpeg', 'image/png', 'image/webp'],
    extensiones: '.jpg,.jpeg,.png,.webp',
    maxBytes: 5 * 1024 * 1024,
    descripcion: 'JPG, PNG o WEBP de hasta 5 MB',
    permiso: 'perfil.propio',
  },
  recurso: {
    carpeta: 'recursos',
    tipos: ['application/pdf'],
    extensiones: '.pdf',
    maxBytes: 10 * 1024 * 1024,
    descripcion: 'PDF de hasta 10 MB',
    permiso: 'recursos.administrar',
  },
  noticia: {
    carpeta: 'noticias',
    tipos: ['image/jpeg', 'image/png', 'image/webp'],
    extensiones: '.jpg,.jpeg,.png,.webp',
    maxBytes: 5 * 1024 * 1024,
    descripcion: 'JPG, PNG o WEBP de hasta 5 MB',
    permiso: 'noticias.administrar',
  },
} as const satisfies Record<
  string,
  {
    carpeta: string
    tipos: readonly string[]
    extensiones: string
    maxBytes: number
    descripcion: string
    permiso: Permiso
  }
>

export type TipoSubida = keyof typeof SUBIDAS

export function esTipoSubida(valor: unknown): valor is TipoSubida {
  return typeof valor === 'string' && valor in SUBIDAS
}

/** Error de validación previo a subir (null si el archivo es aceptable). */
export function validarArchivo(tipo: TipoSubida, archivo: { type: string; size: number }) {
  const regla = SUBIDAS[tipo]
  if (!(regla.tipos as readonly string[]).includes(archivo.type)) {
    return `Tipo de archivo no permitido. Usa ${regla.descripcion}.`
  }
  if (archivo.size > regla.maxBytes) return `El archivo supera el máximo (${regla.descripcion}).`
  return null
}

/** Las URL de archivos subidos deben ser de Vercel Blob (público). */
export function esUrlBlob(url: string) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.host.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}
