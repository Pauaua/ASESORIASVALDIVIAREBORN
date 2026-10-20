import { describe, expect, it } from 'vitest'
import { esUltimoDiaDelMesEnChile } from '@/lib/fechas-chile'
import {
  boletaIndividualSchema,
  facturaIndividualSchema,
  validarExcel,
} from '@/lib/validators/automatizacion'

const boleta = {
  rut: '11.111.111-1',
  clave: 'secreta',
  headless: true,
  rut_dest: '22222222',
  dv_dest: '2',
  nombres_dest: 'Empresa',
  domicilio: 'Calle 1',
  region: '',
  comuna: 'Antofagasta',
  fecha_dia: '5',
  fecha_mes: '3',
  fecha_anio: '2026',
  prestaciones: [
    { glosa: 'Asesoría', valor: '150.000' },
    { glosa: '', valor: '' },
    { glosa: '', valor: '' },
    { glosa: '', valor: '' },
  ],
}

describe('boleta individual', () => {
  it('envía al daemon el contrato exacto, con fecha en 2 dígitos y solo prestaciones con glosa', () => {
    const d = boletaIndividualSchema.parse(boleta)
    expect(d).toEqual({
      rut: '11.111.111-1',
      clave: 'secreta',
      headless: true,
      rut_dest: '22222222',
      dv_dest: '2',
      nombres_dest: 'Empresa',
      domicilio: 'Calle 1',
      region: '',
      comuna: 'Antofagasta',
      fecha_dia: '05',
      fecha_mes: '03',
      fecha_anio: '2026',
      prestaciones: [{ glosa: 'Asesoría', valor: '150.000' }],
    })
  })

  it('valida RUT emisor, DV del destinatario, prestaciones y fecha', () => {
    const errores = (cambios: object) =>
      boletaIndividualSchema
        .safeParse({ ...boleta, ...cambios })
        .error?.issues.map((i) => i.path.join('.'))
    expect(errores({ rut: '11.111.111-2' })).toEqual(['rut'])
    expect(errores({ dv_dest: '9' })).toEqual(['dv_dest'])
    expect(errores({ prestaciones: [{ glosa: '', valor: '' }] })).toEqual(['prestaciones.0.glosa'])
    expect(errores({ prestaciones: [{ glosa: 'x', valor: 'abc' }] })).toEqual([
      'prestaciones.0.valor',
    ])
    expect(errores({ fecha_dia: '31', fecha_mes: '2' })).toEqual(['fecha_dia'])
  })
})

describe('factura individual', () => {
  it('RUT usuario vacío = RUT empresa', () => {
    expect(
      facturaIndividualSchema.parse({ rut_empresa: '76.000.000-0', rut_usuario: '', clave: 'x' }),
    ).toEqual({ rut_empresa: '76.000.000-0', rut_usuario: '76.000.000-0', clave: 'x' })
  })
})

describe('archivos masivos', () => {
  it('acepta Excel/CSV de hasta 10 MB', () => {
    expect(validarExcel({ name: 'boletas.XLSX', size: 1000 })).toBeNull()
    expect(validarExcel({ name: 'datos.csv', size: 1000 })).toBeNull()
    expect(validarExcel({ name: 'virus.exe', size: 1000 })).toMatch(/Formato/)
    expect(validarExcel({ name: 'grande.xlsx', size: 11 * 1024 * 1024 })).toMatch(/máximo/)
  })
})

describe('recordatorio de boletas', () => {
  it('detecta el último día del mes en hora de Chile', () => {
    // 31-oct-2026 23:00 UTC = 20:00 en Chile (último día).
    expect(esUltimoDiaDelMesEnChile(new Date('2026-10-31T23:00:00Z'))).toBe(true)
    // 1-nov-2026 02:00 UTC = 31-oct 23:00 en Chile: sigue siendo el último día allá.
    expect(esUltimoDiaDelMesEnChile(new Date('2026-11-01T02:00:00Z'))).toBe(true)
    expect(esUltimoDiaDelMesEnChile(new Date('2026-10-30T23:00:00Z'))).toBe(false)
    expect(esUltimoDiaDelMesEnChile(new Date('2028-02-29T23:00:00Z'))).toBe(true)
  })
})
