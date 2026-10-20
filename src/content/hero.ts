/** Slides del carrusel principal del home. La línea `medio` se muestra con texto contorneado azul. */
export type SlideHero = {
  arriba: string
  medio: string
  abajo: string
  descripcion: string
  cta: { texto: string; href: string }
  imagen: string
  /** Descripción de la foto de fondo (accesibilidad). */
  alt: string
}

export const slidesHero: readonly SlideHero[] = [
  {
    arriba: 'ASESÓRATE,',
    medio: 'FÓRMATE',
    abajo: 'CRECE.',
    descripcion:
      'Maximiza tu eficiencia y rentabilidad con nuestra asesoría contable y tributaria potenciada por estrategias digitales.',
    cta: { texto: 'Contáctanos', href: '/contacto' },
    imagen: '/Carouselimageone.jpg',
    alt: '',
  },
  {
    arriba: 'INNOVA,',
    medio: 'APRENDE,',
    abajo: 'TRIUNFA.',
    descripcion:
      'Transformamos tus datos en decisiones rentables con nuestra expertise en marketing digital y asesoría contable.',
    cta: { texto: 'Saber más', href: '/contacto' },
    imagen: '/Carouselimagetwo.jpg',
    alt: '',
  },
  {
    arriba: 'DESCUBRE,',
    medio: 'ANALIZA',
    abajo: 'CRECE.',
    descripcion:
      'Desata el potencial de tu negocio con nuestro enfoque digital en asesoría contable y tributaria.',
    // En el sitio anterior iba a /contacto por error.
    cta: { texto: 'Cotiza Ahora', href: '/cotiza' },
    imagen: '/Carouselimagethree.jpg',
    alt: '',
  },
]
