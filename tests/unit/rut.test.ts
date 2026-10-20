import { describe, expect, it } from 'vitest'
import { calcularDv, formatearRut, normalizarRut, validarCuerpoYDv, validarRut } from '@/lib/rut'

describe('RUT chileno (módulo 11)', () => {
  it('calcula el dígito verificador, incluidos 0 y K', () => {
    expect(calcularDv('11111111')).toBe('1')
    expect(calcularDv('12345678')).toBe('5')
    expect(calcularDv('76086428')).toBe('5')
    expect(calcularDv('10000013')).toBe('K')
    expect(calcularDv('10000004')).toBe('0')
  })

  it('valida RUT con y sin formato', () => {
    expect(validarRut('12.345.678-5')).toBe(true)
    expect(validarRut('12345678-5')).toBe(true)
    expect(validarRut('123456785')).toBe(true)
    expect(validarRut('10000013-k')).toBe(true)
    expect(validarRut('12.345.678-9')).toBe(false)
    expect(validarRut('abc')).toBe(false)
    expect(validarRut('')).toBe(false)
    expect(validarRut('123-4')).toBe(false)
  })

  it('valida cuerpo y DV por separado', () => {
    expect(validarCuerpoYDv('12345678', '5')).toBe(true)
    expect(validarCuerpoYDv('12.345.678', '5')).toBe(true)
    expect(validarCuerpoYDv('10000013', 'k')).toBe(true)
    expect(validarCuerpoYDv('12345678', '4')).toBe(false)
    expect(validarCuerpoYDv('12a45678', '5')).toBe(false)
  })

  it('normaliza para guardar y formatea para mostrar', () => {
    expect(normalizarRut('12.345.678-5')).toBe('12345678-5')
    expect(normalizarRut(' 10000013k ')).toBe('10000013-K')
    expect(normalizarRut('12.345.678-9')).toBeNull()
    expect(formatearRut('123456785')).toBe('12.345.678-5')
    expect(formatearRut('9999999-3')).toBe('9.999.999-3')
  })
})
