/**
 * Logos del carrusel "NUESTROS CLIENTES" (home y /nosotros), en el orden del sitio anterior.
 *
 * TODO: completar `alt` con el nombre de cada empresa (p. ej. alt: 'Nombre de la empresa SpA').
 * Mientras esté vacío se usa el texto genérico "Logo de cliente de Asesorías Valdivia".
 *
 * Existen también client29.png y client30.png, que el sitio anterior no mostraba. Para agregarlos,
 * añade una línea con su archivo (ver docs/imagenes.md).
 */
export type LogoCliente = { src: string; width: number; height: number; alt: string }

export const clientes: readonly LogoCliente[] = [
  { src: '/client1.png', width: 823, height: 774, alt: '' },
  { src: '/client2.png', width: 1883, height: 1820, alt: '' },
  { src: '/client3.png', width: 181, height: 181, alt: '' },
  { src: '/client4.png', width: 1300, height: 1300, alt: '' },
  { src: '/client5.png', width: 1037, height: 1031, alt: '' },
  { src: '/client6.png', width: 356, height: 367, alt: '' },
  { src: '/client7.png', width: 816, height: 813, alt: '' },
  { src: '/client8.png', width: 131, height: 131, alt: '' },
  { src: '/client9.png', width: 449, height: 449, alt: '' },
  { src: '/client10.png', width: 144, height: 140, alt: '' },
  { src: '/client11.png', width: 989, height: 989, alt: '' },
  { src: '/client12.png', width: 839, height: 830, alt: '' },
  { src: '/client13.png', width: 500, height: 499, alt: '' },
  { src: '/client14.png', width: 774, height: 766, alt: '' },
  { src: '/client15.png', width: 1920, height: 1919, alt: '' },
  { src: '/client16.png', width: 716, height: 716, alt: '' },
  { src: '/client17.png', width: 1600, height: 1600, alt: '' },
  { src: '/client18.png', width: 248, height: 236, alt: '' },
  { src: '/client19.png', width: 400, height: 400, alt: '' },
  { src: '/client20.png', width: 565, height: 567, alt: '' },
  { src: '/client21.png', width: 1477, height: 1477, alt: '' },
  { src: '/client22.png', width: 616, height: 616, alt: '' },
  { src: '/client23.png', width: 539, height: 533, alt: '' },
  { src: '/client24.png', width: 872, height: 856, alt: '' },
  { src: '/client25.png', width: 604, height: 604, alt: '' },
  { src: '/client26.png', width: 431, height: 431, alt: '' },
  { src: '/client27.png', width: 1599, height: 1599, alt: '' },
  { src: '/client28.png', width: 169, height: 169, alt: '' },
  { src: '/client31.png', width: 277, height: 273, alt: '' },
  { src: '/client32.png', width: 251, height: 251, alt: '' },
  { src: '/client33.jpeg', width: 1600, height: 1600, alt: '' },
  { src: '/client34.jpeg', width: 1600, height: 1600, alt: '' },
  { src: '/client35.jpeg', width: 1202, height: 1280, alt: '' },
  { src: '/client36.png', width: 402, height: 332, alt: '' },
  { src: '/client37.jpeg', width: 330, height: 307, alt: '' },
  { src: '/client38.jpeg', width: 241, height: 264, alt: '' },
  { src: '/client39.jpeg', width: 1599, height: 734, alt: '' },
  { src: '/client40.jpeg', width: 513, height: 299, alt: '' },
]

export const ALT_CLIENTE_GENERICO = 'Logo de cliente de Asesorías Valdivia'
