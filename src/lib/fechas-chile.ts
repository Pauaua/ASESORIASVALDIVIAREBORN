/** Utilidades de fecha en la zona horaria de Chile (módulo puro, probado en tests/unit). */

export const ZONA_CHILE = 'America/Santiago'

export function partesFechaChile(fecha: Date) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_CHILE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha)
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value)
  return { anio: valor('year'), mes: valor('month'), dia: valor('day') }
}

/** ¿Es `fecha` el último día del mes en Chile? (mañana, en Chile, es día 1). */
export function esUltimoDiaDelMesEnChile(fecha: Date) {
  return partesFechaChile(new Date(fecha.getTime() + 24 * 60 * 60 * 1000)).dia === 1
}

/** "octubre" */
export function nombreMesChile(fecha: Date) {
  return new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: ZONA_CHILE }).format(fecha)
}
