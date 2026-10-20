/** Equipo que aparece en /nosotros (credenciales). */
export type MiembroEquipo = {
  nombre: string
  /** Cargo opcional; las credenciales ya lo muestran en la imagen. */
  cargo?: string
  imagen: { src: string; width: number; height: number }
  alt: string
}

const credencial = (src: string) => ({ src, width: 776, height: 1031 })

export const equipo: readonly MiembroEquipo[] = [
  {
    nombre: 'Ricardo Valdivia Salis',
    imagen: credencial('/credencialricardo.png'),
    alt: 'Ricardo Valdivia Salis',
  },
  {
    nombre: 'Gabriela Oyanadel Dubost',
    imagen: credencial('/credencialgabriela.png'),
    alt: 'Gabriela Oyanadel Dubost',
  },
  {
    nombre: 'Ariel Villaman Sanchez',
    imagen: credencial('/credencialariel.png'),
    alt: 'Ariel Villaman Sanchez',
  },
  {
    nombre: 'Hector Valdivia Ramos',
    imagen: credencial('/credencialhector.png'),
    alt: 'Hector Valdivia Ramos',
  },
  {
    // TODO: apellido de Jesús (pendiente de confirmar). Al completarlo, actualiza `nombre` y `alt`.
    nombre: 'Jesús',
    imagen: { src: '/credencialjesus.png', width: 373, height: 495 },
    alt: 'Jesús, equipo Asesorías Valdivia',
  },
]
