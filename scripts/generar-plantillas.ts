/**
 * Genera las plantillas Excel de ejemplo para la automatización masiva:
 *   public/plantillas/plantilla-boletas.xlsx
 *   public/plantillas/plantilla-facturas.xlsx
 *
 * Usan SOLO datos ficticios. Nunca copies aquí el Excel real del sitio anterior: tiene datos de
 * clientes y claves del SII.
 *
 * Uso: npm run plantillas
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import ExcelJS from 'exceljs'

const DESTINO = join(process.cwd(), 'public', 'plantillas')

type Hoja = { columnas: { header: string; key: string; width: number }[]; filas: object[] }

async function generar(nombre: string, hoja: Hoja, notas: string[]) {
  const libro = new ExcelJS.Workbook()
  libro.creator = 'Asesorías Valdivia'
  const datos = libro.addWorksheet('Datos')
  datos.columns = hoja.columnas
  datos.addRows(hoja.filas)
  datos.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  datos.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B55A0' } }
  // Todo como texto: el daemon recibe los RUT y valores tal como se escriben.
  datos.columns.forEach((c) => (c.numFmt = '@'))

  const ayuda = libro.addWorksheet('Instrucciones')
  ayuda.getColumn(1).width = 110
  for (const linea of notas) ayuda.addRow([linea])
  ayuda.getRow(1).font = { bold: true, size: 13 }

  await libro.xlsx.writeFile(join(DESTINO, nombre))
  console.log(`✓ ${nombre}`)
}

async function main() {
  mkdirSync(DESTINO, { recursive: true })

  await generar(
    'plantilla-boletas.xlsx',
    {
      columnas: [
        { header: 'RUT', key: 'rut', width: 14 },
        { header: 'CLAVE', key: 'clave', width: 14 },
        { header: 'RUT_DEST', key: 'rutDest', width: 12 },
        { header: 'DV', key: 'dv', width: 5 },
        { header: 'NOMBRE_DEST', key: 'nombre', width: 28 },
        { header: 'DOMICILIO', key: 'domicilio', width: 26 },
        { header: 'REGIÓN', key: 'region', width: 14 },
        { header: 'COMUNA', key: 'comuna', width: 14 },
        { header: 'FECHA_DIA', key: 'dia', width: 10 },
        { header: 'FECHA_MES', key: 'mes', width: 10 },
        { header: 'FECHA_ANIO', key: 'anio', width: 11 },
        { header: 'PRESTACION', key: 'prestacion', width: 34 },
        { header: 'VALOR', key: 'valor', width: 10 },
        { header: 'PRESTACION_2', key: 'prestacion2', width: 30 },
        { header: 'VALOR_2', key: 'valor2', width: 10 },
      ],
      filas: [
        {
          rut: '11.111.111-1',
          clave: 'clave-de-ejemplo',
          rutDest: '22222222',
          dv: '2',
          nombre: 'Empresa de Ejemplo SpA',
          domicilio: 'Calle Falsa 123',
          region: 'Antofagasta',
          comuna: 'Antofagasta',
          dia: '01',
          mes: '01',
          anio: '2026',
          prestacion: 'Asesoría contable mensual',
          valor: '150000',
          prestacion2: '',
          valor2: '',
        },
        {
          rut: '11.111.111-1',
          clave: 'clave-de-ejemplo',
          rutDest: '33333333',
          dv: '3',
          nombre: 'Juan Ejemplo Pérez',
          domicilio: 'Av. Siempre Viva 742',
          region: 'Antofagasta',
          comuna: 'Calama',
          dia: '15',
          mes: '01',
          anio: '2026',
          prestacion: 'Declaración de renta',
          valor: '80000',
          prestacion2: 'Revisión de documentos',
          valor2: '20000',
        },
      ],
    },
    [
      'Plantilla de boletas de honorarios (carga masiva)',
      '',
      '• Una fila por boleta. Reemplaza las filas de ejemplo: los datos son ficticios.',
      '• RUT: RUT del emisor con dígito verificador. CLAVE: su clave del SII.',
      '• RUT_DEST: RUT del destinatario SIN dígito verificador; el DV va en la columna DV.',
      '• REGIÓN es opcional. FECHA_DIA, FECHA_MES y FECHA_ANIO son opcionales (por defecto, hoy).',
      '• PRESTACION y VALOR son obligatorias. Se pueden agregar PRESTACION_2..4 y VALOR_2..4.',
      '• Guarda el archivo como .xlsx (o .csv) y súbelo en Panel → Automatización → Boletas → Masivo.',
      '• Este archivo contiene claves del SII: no lo compartas ni lo dejes en carpetas públicas.',
    ],
  )

  await generar(
    'plantilla-facturas.xlsx',
    {
      columnas: [
        { header: 'RUT_EMPRESA', key: 'empresa', width: 16 },
        { header: 'RUT_USUARIO', key: 'usuario', width: 16 },
        { header: 'CLAVE', key: 'clave', width: 18 },
      ],
      filas: [
        { empresa: '76.000.000-0', usuario: '11.111.111-1', clave: 'clave-de-ejemplo' },
        { empresa: '77.777.777-7', usuario: '', clave: 'clave-de-ejemplo' },
      ],
    },
    [
      'Plantilla de aceptación de facturas electrónicas (carga masiva)',
      '',
      '• Una fila por empresa. Reemplaza las filas de ejemplo: los datos son ficticios.',
      '• RUT_USUARIO es opcional: si se deja vacío se usa el RUT de la empresa.',
      '• CLAVE: clave del SII del usuario.',
      '• Este archivo contiene claves del SII: no lo compartas ni lo dejes en carpetas públicas.',
    ],
  )
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
