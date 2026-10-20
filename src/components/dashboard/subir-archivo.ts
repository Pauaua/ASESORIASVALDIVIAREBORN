'use client'

import { upload } from '@vercel/blob/client'
import { SUBIDAS, validarArchivo, type TipoSubida } from '@/lib/subidas'

/** Nombre de archivo seguro para la ruta en Blob (sin acentos, espacios ni separadores). */
function nombreSeguro(nombre: string) {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)
  return limpio || 'archivo'
}

/**
 * Sube un archivo directo del navegador a Vercel Blob (el servidor solo firma el token, tras
 * verificar sesión y permiso). Devuelve la URL pública o lanza un Error con mensaje en español.
 */
export async function subirArchivo(tipo: TipoSubida, archivo: File): Promise<string> {
  const error = validarArchivo(tipo, archivo)
  if (error) throw new Error(error)
  try {
    const blob = await upload(`${SUBIDAS[tipo].carpeta}/${nombreSeguro(archivo.name)}`, archivo, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ tipo }),
      contentType: archivo.type,
    })
    return blob.url
  } catch (e) {
    const mensaje = (e as Error).message ?? ''
    if (mensaje.includes('no está configurada')) {
      throw new Error('La subida de archivos no está configurada (falta BLOB_READ_WRITE_TOKEN).')
    }
    throw new Error('No se pudo subir el archivo. Inténtalo de nuevo.')
  }
}
