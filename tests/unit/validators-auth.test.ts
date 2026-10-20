import { describe, expect, it } from 'vitest'
import { loginSchema, restablecerClaveSchema, rutaInternaSegura } from '@/lib/validators/auth'

describe('validadores de autenticación', () => {
  it('normaliza el correo a minúsculas', () => {
    const r = loginSchema.parse({ email: '  Admin@Ejemplo.CL ', password: 'x' })
    expect(r.email).toBe('admin@ejemplo.cl')
  })

  it('exige 8 caracteres, confirmación igual y token válido', () => {
    const token = 'a'.repeat(64)
    const valida = (password: string, confirmPassword: string, t = token) =>
      restablecerClaveSchema.safeParse({ token: t, password, confirmPassword }).success

    expect(valida('corta', 'corta')).toBe(false)
    expect(valida('12345678', '12345679')).toBe(false)
    expect(valida('12345678', '12345678')).toBe(true)
    expect(valida('12345678', '12345678', 'xyz')).toBe(false)
  })

  it('solo acepta callbackUrl internas', () => {
    expect(rutaInternaSegura('/dashboard/recursos')).toBe('/dashboard/recursos')
    expect(rutaInternaSegura('https://evil.com')).toBe('/dashboard')
    expect(rutaInternaSegura('//evil.com')).toBe('/dashboard')
    expect(rutaInternaSegura('/\\evil.com')).toBe('/dashboard')
    expect(rutaInternaSegura(undefined)).toBe('/dashboard')
  })
})
