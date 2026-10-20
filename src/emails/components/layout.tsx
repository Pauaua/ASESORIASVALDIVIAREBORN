import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'
import { sitio } from '@/content/sitio'

export const colores = {
  azul: '#2B55A0',
  verde: '#B4E5A3',
  blancoHueso: '#EDEDE6',
  texto: '#1f2937',
  gris: '#6b7280',
}

type Props = {
  /** Texto de vista previa en la bandeja de entrada. */
  preview: string
  /** URL pública del sitio, para el logo y los enlaces. */
  appUrl: string
  children: ReactNode
}

/** Estructura común de todos los correos de Asesorías Valdivia. */
export function EmailLayout({ preview, appUrl, children }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colores.blancoHueso,
          fontFamily: 'Helvetica, Arial, sans-serif',
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            maxWidth: 560,
            overflow: 'hidden',
          }}
        >
          <Section style={{ backgroundColor: colores.azul, padding: '20px 32px' }}>
            <Img
              src={`${appUrl}/logouno.png`}
              alt={sitio.nombre}
              width={180}
              height={67}
              style={{ display: 'block' }}
            />
          </Section>
          <Section style={{ padding: '24px 32px', color: colores.texto }}>{children}</Section>
          <Hr style={{ borderColor: colores.blancoHueso, margin: 0 }} />
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{ color: colores.gris, fontSize: 12, lineHeight: '18px', margin: 0 }}>
              {sitio.nombre} · {sitio.direccion.calle}, {sitio.direccion.ciudad}, Chile
              <br />
              <Link href={`mailto:${sitio.email}`} style={{ color: colores.azul }}>
                {sitio.email}
              </Link>{' '}
              ·{' '}
              <Link href={appUrl} style={{ color: colores.azul }}>
                {appUrl.replace(/^https?:\/\//, '')}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const estilos = {
  titulo: { color: colores.azul, fontSize: 20, fontWeight: 700, margin: '0 0 16px' },
  parrafo: { fontSize: 15, lineHeight: '24px', margin: '0 0 12px' },
  etiqueta: { color: colores.gris, fontSize: 12, margin: '0', textTransform: 'uppercase' as const },
  valor: { fontSize: 15, lineHeight: '22px', margin: '0 0 12px', whiteSpace: 'pre-wrap' as const },
}
