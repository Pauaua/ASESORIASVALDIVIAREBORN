/** Datos de contacto e identidad de Asesorías Valdivia (fuente única para todo el sitio). */
export const sitio = {
  nombre: 'Asesorías Valdivia',
  razonSocial: 'Asesorías Valdivia SpA',
  url: 'https://www.asesoriasvaldivia.cl',
  descripcion:
    'Asesorías Valdivia — Servicios de Asesoría Contable, Laboral, Tributaria y Auditorías en Antofagasta, Chile.',
  email: 'contacto@asesoriasvaldivia.cl',
  telefono: '+56978505042',
  telefonoVisible: '+56978505042',
  whatsapp: {
    numero: '56978505042',
    mensaje: 'Hola Asesorías Valdivia, me gustaría realizar la siguiente consulta...',
  },
  direccion: {
    calle: 'Arturo Prat #482, Oficina 305',
    lineas: ['Arturo Prat #482,', 'Oficina 305.', 'Antofagasta, Chile.'],
    ciudad: 'Antofagasta',
    region: 'Antofagasta',
    pais: 'CL',
    // Coordenadas aproximadas del mapa embebido del sitio anterior.
    lat: -23.544003,
    lng: -70.397426,
  },
  mapaEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.8864269776224!2d-70.39742648255615!3d-23.54400329999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96afd5d738c6d8e7%3A0x7e3b1ff1a2d6b5b0!2sArturo%20Prat%20482%2C%20Antofagasta%2C%20Chile!5e0!3m2!1sen!2sus!4v1632501144712!5m2!1sen!2sus',
  redes: {
    facebook: 'https://www.facebook.com/AsesoriasValdiviaSpA',
    instagram: 'https://www.instagram.com/asesoriasvaldivia/',
  },
} as const

export const whatsappUrl = `https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(sitio.whatsapp.mensaje)}`
