import 'server-only'
import { env } from '@/env'
import AcuseRecibo from '@/emails/acuse-recibo'
import NotificacionFormulario, {
  TITULOS_FORMULARIO,
  type NotificacionFormularioProps,
} from '@/emails/notificacion-formulario'
import { sendEmail } from './send'

type DatosFormulario = Omit<NotificacionFormularioProps, 'appUrl'>

/**
 * Aviso interno a EMAIL_TO por cada formulario público, con reply-to = correo de quien escribe.
 * Se llama DESPUÉS de guardar en la base: si falla, el mensaje ya quedó en la bandeja del panel.
 */
export async function notifyInternal(datos: DatosFormulario) {
  if (!env.EMAIL_TO) {
    console.warn(`[email:interno-${datos.tipo}] no enviado: falta EMAIL_TO`)
    return { ok: false as const, error: 'Falta EMAIL_TO' }
  }
  return sendEmail({
    tipo: `interno-${datos.tipo}`,
    to: env.EMAIL_TO,
    replyTo: datos.correo,
    subject: `${TITULOS_FORMULARIO[datos.tipo]} — ${datos.nombre} ${datos.apellido}`,
    react: <NotificacionFormulario appUrl={env.NEXT_PUBLIC_APP_URL} {...datos} />,
  })
}

/** Confirmación al visitante. Su fallo tampoco afecta la respuesta del formulario. */
export async function sendAcuseRecibo(datos: Pick<DatosFormulario, 'tipo' | 'nombre' | 'correo'>) {
  return sendEmail({
    tipo: `acuse-${datos.tipo}`,
    to: datos.correo,
    replyTo: env.EMAIL_TO,
    subject: 'Recibimos tu mensaje — Asesorías Valdivia',
    react: <AcuseRecibo appUrl={env.NEXT_PUBLIC_APP_URL} tipo={datos.tipo} nombre={datos.nombre} />,
  })
}
