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
