/**
 * RUT chileno: validación con dígito verificador (módulo 11) y normalización.
 * Módulo puro: se usa igual en el cliente y en el servidor.
 */

/** Quita puntos, espacios y guiones, y pasa la K a mayúscula. */
export function limpiarRut(rut: string): string {
  return rut.replace(/[.\s-]/g, '').toUpperCase()
}

/** Dígito verificador (0-9 o K) del cuerpo numérico de un RUT. */
export function calcularDv(cuerpo: string | number): string {
  const digitos = String(cuerpo).replace(/\D/g, '')
  let suma = 0
  let multiplicador = 2
  for (let i = digitos.length - 1; i >= 0; i--) {
    suma += Number(digitos[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

/** Separa cuerpo y DV si el formato es plausible (7 u 8 dígitos + DV). */
function partes(rut: string): { cuerpo: string; dv: string } | null {
  const limpio = limpiarRut(rut)
  const match = /^(\d{7,8})([\dK])$/.exec(limpio)
  if (!match?.[1] || !match[2]) return null
  return { cuerpo: match[1].replace(/^0+/, '') || '0', dv: match[2] }
}

/** true si el RUT completo (con DV, con o sin puntos y guion) es válido. */
export function validarRut(rut: string): boolean {
  const p = partes(rut)
  return p !== null && calcularDv(p.cuerpo) === p.dv
}

/** true si `cuerpo` (sin DV) y `dv` forman un RUT válido. */
export function validarCuerpoYDv(cuerpo: string, dv: string): boolean {
  const c = cuerpo.replace(/[.\s]/g, '')
  if (!/^\d{7,8}$/.test(c)) return false
  return calcularDv(c) === dv.trim().toUpperCase()
}

/** Forma normalizada para guardar: `12345678-K` (sin puntos). Devuelve null si no es válido. */
export function normalizarRut(rut: string): string | null {
  const p = partes(rut)
  if (!p || calcularDv(p.cuerpo) !== p.dv) return null
  return `${p.cuerpo}-${p.dv}`
}

/** Forma para mostrar: `12.345.678-K`. Si no es válido, devuelve el texto tal cual. */
export function formatearRut(rut: string): string {
  const p = partes(rut)
  if (!p) return rut
  return `${p.cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${p.dv}`
}
