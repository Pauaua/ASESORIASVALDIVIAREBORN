import 'server-only'
import { headers } from 'next/headers'

/** IP del visitante según los headers que agrega Vercel (o "desconocida" en local). */
export async function getClientIp() {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || h.get('x-real-ip') || 'desconocida'
}
