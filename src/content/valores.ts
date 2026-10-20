/** Valores de /nosotros. Los títulos van dentro de las imágenes; el texto queda para lectores de pantalla. */
export type Valor = {
  titulo: string
  detalle?: string
  imagen: { src: string; width: number; height: number }
}

export const valores: readonly Valor[] = [
  { titulo: 'Honestidad', imagen: { src: '/iconohonestidad.png', width: 366, height: 378 } },
  {
    titulo: 'Responsabilidad',
    imagen: { src: '/iconoresponsabilidad.png', width: 366, height: 378 },
  },
  {
    titulo: 'Respeto',
    detalle: 'Por nuestros/as clientes y nuestro trabajo',
    imagen: { src: '/iconorespeto.png', width: 397, height: 409 },
  },
]
