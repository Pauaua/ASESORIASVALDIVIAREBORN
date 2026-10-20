const formatoFecha = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "2024-09-20" → "20 de septiembre de 2024". Las fechas sin hora se tratan en UTC. */
export function formatearFecha(fecha: string | Date) {
  const valor = typeof fecha === 'string' ? new Date(`${fecha.slice(0, 10)}T00:00:00Z`) : fecha
  return formatoFecha.format(valor)
}

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Santiago',
})

/** Fecha y hora de Chile para tablas del panel: "20-10-2026, 15:30". */
export function formatearFechaHora(fecha: Date | string) {
  return formatoFechaHora.format(typeof fecha === 'string' ? new Date(fecha) : fecha)
}
