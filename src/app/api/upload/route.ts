import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { env } from '@/env'
import { can } from '@/lib/rbac'
import { getUsuario } from '@/lib/session'
import { esTipoSubida, SUBIDAS } from '@/lib/subidas'

/**
 * Firma tokens de subida directa del navegador a Vercel Blob. Es un Route Handler (y no una
 * Server Action) porque así lo exige el protocolo de subida de cliente de @vercel/blob; el
 * archivo nunca pasa por esta función.
 */
export async function POST(request: Request) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'La subida de archivos no está configurada.' },
      { status: 503 },
    )
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const respuesta = await handleUpload({
      token: env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const usuario = await getUsuario()
        if (!usuario) throw new Error('Sesión expirada')

        const tipo: unknown = clientPayload ? JSON.parse(clientPayload).tipo : null
        if (!esTipoSubida(tipo)) throw new Error('Tipo de subida inválido')
        const regla = SUBIDAS[tipo]
        if (!can(usuario.rol, regla.permiso)) throw new Error('Sin permiso')
        if (!pathname.startsWith(`${regla.carpeta}/`) || pathname.includes('..')) {
          throw new Error('Ruta inválida')
        }

        return {
          allowedContentTypes: [...regla.tipos],
          maximumSizeInBytes: regla.maxBytes,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        }
      },
    })
    return NextResponse.json(respuesta)
  } catch (error) {
    const mensaje = (error as Error).message
    const status = mensaje === 'Sesión expirada' ? 401 : mensaje === 'Sin permiso' ? 403 : 400
    return NextResponse.json({ error: mensaje }, { status })
  }
}
