import { Button, Text } from '@react-email/components'
import { EmailLayout, colores, estilos } from './components/layout'

export type RecordatorioBoletasProps = { appUrl: string; mes: string; anio: number }

/** Aviso a los ADMIN el último día del mes para emitir las boletas electrónicas. */
export default function RecordatorioBoletas({ appUrl, mes, anio }: RecordatorioBoletasProps) {
  return (
    <EmailLayout preview={`Recordatorio: emitir boletas electrónicas de ${mes}`} appUrl={appUrl}>
      <Text style={estilos.titulo}>Recordatorio de boletas</Text>
      <Text style={estilos.parrafo}>
        Hoy es el último día de {mes} de {anio}.
      </Text>
      <Text style={estilos.parrafo}>
        Recuerda realizar el proceso de emisión de boletas electrónicas del mes desde el panel de
        automatización antes de fin de día.
      </Text>
      <Button
        href={`${appUrl}/dashboard/automatizacion`}
        style={{
          backgroundColor: colores.azul,
          borderRadius: 8,
          color: '#ffffff',
          display: 'inline-block',
          fontSize: 15,
          fontWeight: 600,
          padding: '12px 24px',
        }}
      >
        Ir a Automatización
      </Button>
    </EmailLayout>
  )
}

RecordatorioBoletas.PreviewProps = {
  appUrl: 'http://localhost:3000',
  mes: 'octubre',
  anio: 2026,
} satisfies RecordatorioBoletasProps
