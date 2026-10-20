import 'server-only'
import { del } from '@vercel/blob'
import { env } from '@/env'
import { esUrlBlob } from '@/lib/subidas'

/**
 * Borra un archivo de Vercel Blob sin fallar: si no está configurado, la URL no es de Blob o el
 * archivo pertenece a otro store (p. ej. imágenes del sitio anterior), solo se registra.
 */
export async function borrarBlob(url: string | null | undefined) {
  if (!url || !env.BLOB_READ_WRITE_TOKEN || !esUrlBlob(url)) return
  try {
    await del(url, { token: env.BLOB_READ_WRITE_TOKEN })
  } catch (error) {
    console.warn(`[blob] no se pudo borrar un archivo: ${(error as Error).name}`)
  }
}
