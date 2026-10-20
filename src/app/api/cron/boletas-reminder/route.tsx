import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { env } from '@/env'
import RecordatorioBoletas from '@/emails/recordatorio-boletas'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/send'
import { esUltimoDiaDelMesEnChile, nombreMesChile, partesFechaChile } from '@/lib/fechas-chile'

/**
 * Cron de Vercel (vercel.json, todos los días a las 23:00 UTC = 19:00/20:00 en Chile): el último
 * día del mes avisa por correo a los ADMIN activos que deben emitir las boletas del mes.
 *
 * Vercel envía `Authorization: Bearer ${CRON_SECRET}`. Sin CRON_SECRET el cron no se ejecuta.
 */
function autorizado(request: Request) {
  if (!env.CRON_SECRET) return false
  const esperado = Buffer.from(`Bearer ${env.CRON_SECRET}`)
  const recibido = Buffer.from(request.headers.get('authorization') ?? '')
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido)
}

export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 503 })
  }
  if (!autorizado(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ahora = new Date()
  if (!esUltimoDiaDelMesEnChile(ahora)) {
    return NextResponse.json({ skipped: true, reason: 'No es el último día del mes' })
  }

  const admins = await db.user.findMany({
    where: { role: 'ADMIN', active: true },
    select: { email: true },
  })
  if (admins.length === 0) {
    return NextResponse.json({ skipped: true, reason: 'No hay usuarios ADMIN activos' })
  }

  const r = await sendEmail({
    tipo: 'recordatorio-boletas',
    to: admins.map((a) => a.email),
    subject: `Recordatorio: emitir boletas electrónicas de ${nombreMesChile(ahora)}`,
    react: (
      <RecordatorioBoletas
        appUrl={env.NEXT_PUBLIC_APP_URL}
        mes={nombreMesChile(ahora)}
        anio={partesFechaChile(ahora).anio}
      />
    ),
  })
  if (!r.ok) {
    return NextResponse.json({ error: 'Error al enviar el recordatorio' }, { status: 500 })
  }
  // No se devuelven los correos de los destinatarios.
  return NextResponse.json({ sent: true, destinatarios: admins.length })
}
