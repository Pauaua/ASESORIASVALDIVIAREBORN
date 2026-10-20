'use server'

import { env } from '@/env'
import CorreoPrueba from '@/emails/correo-prueba'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/send'
import { formatearFechaHora } from '@/lib/fechas'
import { requirePermiso } from '@/lib/session'
import { ejecutar, exito, fallo, type Resultado } from './resultado'

/** Envía un correo de prueba al ADMIN que lo pide (solo ADMIN). */
export async function enviarCorreoPrueba(): Promise<Resultado> {
  return ejecutar('enviarCorreoPrueba', async () => {
    const yo = await requirePermiso('sistema.estado')
    const usuario = await db.user.findUnique({ where: { id: yo.id }, select: { email: true } })
    if (!usuario) return fallo(404, 'Usuario no encontrado.')

    const r = await sendEmail({
      tipo: 'prueba',
      to: usuario.email,
      subject: 'Correo de prueba — Asesorías Valdivia',
      react: (
        <CorreoPrueba appUrl={env.NEXT_PUBLIC_APP_URL} fecha={formatearFechaHora(new Date())} />
      ),
    })
    if (!r.ok) return fallo(502, `No se pudo enviar: ${r.error}`)
    return exito(`Correo de prueba enviado a ${usuario.email}.`)
  })
}
