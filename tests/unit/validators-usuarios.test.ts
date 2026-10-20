import { describe, expect, it } from 'vitest'
import { archivoSchema, categoriaSchema } from '@/lib/validators/recursos'
import {
  crearUsuarioSchema,
  driveUrlSchema,
  editarUsuarioSchema,
  perfilClienteSchema,
} from '@/lib/validators/usuarios'

/*
 * react-hook-form entrega a la Server Action la SALIDA del esquema (con vacíos → null), y el
 * servidor vuelve a validar con el mismo esquema: cada esquema debe aceptar su propia salida.
 */
const base = {
  name: 'Paz',
  lastname: 'Prueba',
  username: 'pazprueba',
  phone: '',
  email: 'Paz.Prueba@Ejemplo.cl',
  company: '',
  companyEmail: '',
  companyPhone: '',
  companyRUT: '',
  driveURL: '',
}

describe('esquemas idempotentes (cliente → servidor)', () => {
  it('alta de usuario', () => {
    const salida = crearUsuarioSchema.parse({ ...base, password: 'ClaveSegura1', role: 'TEAM' })
    expect(salida.company).toBeNull()
    expect(salida.email).toBe('paz.prueba@ejemplo.cl')
    expect(crearUsuarioSchema.safeParse(salida).success).toBe(true)
  })

  it('alta de TEAM descarta datos de cliente', () => {
    const salida = crearUsuarioSchema.parse({
      ...base,
      password: 'ClaveSegura1',
      role: 'TEAM',
      company: 'X',
      driveURL: 'https://drive.google.com/a',
    })
    expect(salida.company).toBeNull()
    expect(salida.driveURL).toBeNull()
  })

  it('edición y perfil', () => {
    const edicion = editarUsuarioSchema.parse({ ...base, password: '', role: 'CLIENT' })
    expect(edicion.password).toBeUndefined()
    expect(editarUsuarioSchema.safeParse(edicion).success).toBe(true)
    const perfil = perfilClienteSchema.parse({ ...base, companyRUT: '12.345.678-5' })
    expect(perfil.companyRUT).toBe('12345678-5')
    expect(perfilClienteSchema.safeParse(perfil).success).toBe(true)
  })

  it('recursos', () => {
    const categoria = categoriaSchema.parse({ name: 'Guías', description: '' })
    expect(categoriaSchema.safeParse(categoria).success).toBe(true)
    expect(
      archivoSchema.safeParse({
        name: 'A',
        url: 'javascript:alert(1)',
        type: 'link',
        resourceId: 1,
      }).success,
    ).toBe(false)
  })

  it('Drive solo acepta Google Drive/Docs por https', () => {
    expect(driveUrlSchema.parse('https://drive.google.com/drive/folders/x')).toContain('drive')
    expect(driveUrlSchema.safeParse('http://drive.google.com/x').success).toBe(false)
    expect(driveUrlSchema.safeParse('https://drive.google.com.evil.cl/x').success).toBe(false)
    expect(driveUrlSchema.parse('')).toBeNull()
  })
})
