import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { sitio } from '@/content/sitio'

export const alt =
  'Asesorías Valdivia — Asesoría contable, laboral, tributaria y auditorías en Antofagasta'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Lee un archivo de public/ como data URL; si no existe (aún no insertado), devuelve null. */
async function dataUrl(archivo: string, mime: string) {
  try {
    const buffer = await readFile(join(process.cwd(), 'public', archivo))
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

/** Imagen para compartir en redes (1200×630), generada en el build con los colores de marca. */
export default async function OpengraphImage() {
  const logo = await dataUrl('logouno.png', 'image/png')

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: 'linear-gradient(135deg, #2B55A0 0%, #2B55A0 55%, #B4E5A3 140%)',
        color: '#EDEDE6',
        fontFamily: 'sans-serif',
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img>
        <img src={logo} alt="" width={420} height={155} />
      ) : (
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: 4 }}>ASESORÍAS VALDIVIA</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, color: '#ffffff' }}>
          Asesórate, fórmate, crece.
        </div>
        <div style={{ fontSize: 32, lineHeight: 1.3 }}>
          Asesoría contable, laboral, tributaria y auditorías en Antofagasta, Chile.
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 26,
          color: '#B4E5A3',
        }}
      >
        <span>{sitio.url.replace('https://', '')}</span>
        <span>{sitio.email}</span>
      </div>
    </div>,
    size,
  )
}
