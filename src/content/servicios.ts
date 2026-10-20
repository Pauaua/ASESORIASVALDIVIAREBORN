/**
 * Servicios de Asesorías Valdivia. Fuente única para el home, /servicios, el formulario de
 * cotización y la sección "Servicios" del panel.
 */

/** Valores que guarda el formulario de cotización en `CotizationForm.servicio` (no cambiar). */
export const SERVICIO_IDS = ['contable', 'laboral', 'tributaria', 'auditorias'] as const
export type ServicioId = (typeof SERVICIO_IDS)[number]

export type Servicio = {
  id: ServicioId
  /** Título corto (tarjetas del home y panel). */
  titulo: string
  /** Título en mayúsculas de /servicios. */
  tituloLargo: string
  /** Texto de la opción en el formulario de cotización. */
  opcionCotizacion: string
  descripcion: string
  imagen: { src: string; width: number; height: number }
  /** Precio referencial. Opcional: si falta, no se muestra. */
  precio?: string
}

const imagenServicio = (src: string) => ({ src, width: 1570, height: 1364 })

export const servicios: readonly Servicio[] = [
  {
    id: 'contable',
    titulo: 'Asesorías Contables',
    tituloLargo: 'ASESORÍAS CONTABLES',
    opcionCotizacion: 'Asesoría Contable',
    descripcion:
      'Nuestro servicio contable abarca desde la contabilidad diaria hasta la preparación de estados financieros y reportes fiscales. Nos aseguramos de que tus registros contables estén actualizados y cumplan con las normativas vigentes. Además, te proporcionamos análisis financieros que te ayudarán a entender mejor la situación económica de tu empresa y a planificar su crecimiento.',
    imagen: imagenServicio('/cardasesoriascontables.png'),
  },
  {
    id: 'laboral',
    titulo: 'Asesorías Laborales',
    tituloLargo: 'ASESORÍAS LABORALES',
    opcionCotizacion: 'Asesoría Laboral',
    descripcion:
      'Ofrecemos asesoría en todas las áreas relacionadas con la gestión de recursos humanos, incluyendo la elaboración de contratos, nóminas, cumplimiento de normativas laborales y resolución de conflictos. Nuestro objetivo es garantizar un ambiente laboral justo y conforme a la ley, optimizando la gestión de tu equipo humano.',
    imagen: imagenServicio('/cardasesorialaboral.png'),
  },
  {
    id: 'tributaria',
    titulo: 'Asesorías Tributarias',
    tituloLargo: 'ASESORÍAS TRIBUTARIAS',
    opcionCotizacion: 'Asesoría Tributaria',
    descripcion:
      'En el área tributaria, te ayudamos a cumplir con todas tus obligaciones fiscales de manera eficiente y estratégica. Esto incluye la preparación y presentación de declaraciones de impuestos, planificación fiscal para optimizar la carga tributaria y asesoría en caso de inspecciones o requerimientos por parte de las autoridades fiscales.',
    imagen: imagenServicio('/cardasesoriatributaria.png'),
  },
  {
    id: 'auditorias',
    titulo: 'Auditorías',
    tituloLargo: 'AUDITORÍAS',
    opcionCotizacion: 'Auditorías',
    descripcion:
      'Nuestro servicio de auditorías proporciona una revisión exhaustiva e independiente de tus estados financieros y procesos operativos. Realizamos auditorías internas y externas que aseguran la veracidad de la información financiera y la eficiencia de los procesos, identificando áreas de mejora y garantizando la transparencia y confianza en la gestión de tu empresa.',
    imagen: imagenServicio('/cardauditoria.png'),
  },
]

export function nombreServicio(id: string) {
  return servicios.find((s) => s.id === id)?.opcionCotizacion ?? id
}
