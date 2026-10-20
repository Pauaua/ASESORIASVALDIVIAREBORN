/**
 * Noticias del sitio anterior (2024), con el texto original. En la fase 6 se mueven a la base de
 * datos (modelo Post) y este archivo queda solo como seed.
 *
 * Los párrafos se separaron donde el original tenía doble espacio; el texto no se modificó.
 */
export type Noticia = {
  slug: string
  titulo: string
  /** Fecha de publicación (AAAA-MM-DD). */
  fecha: string
  imagen: { src: string; width: number; height: number }
  parrafos: string[]
  fuentes: string[]
}

export const noticias: readonly Noticia[] = [
  {
    slug: 'el-consejo-de-finanzas-mas-valioso-gastar-menos-de',
    titulo:
      'El Consejo de Finanzas Más Valioso: Gastar Menos de lo que Ganas y Ahorrar el 20% de tus Ingresos',
    fecha: '2024-09-20',
    imagen: {
      src: '/CardNoticiasUno.jpg',
      width: 2309,
      height: 1299,
    },
    parrafos: [
      "En el mundo de las finanzas personales, uno de los consejos más repetidos por expertos es simple pero poderoso: 'Gasta menos de lo que ganas y ahorra al menos el 20% de tus ingresos'. Este principio, según economistas y asesores financieros, es la clave para alcanzar la estabilidad económica a largo plazo y construir un patrimonio sólido. Al vivir por debajo de tus posibilidades y mantener un enfoque constante en el ahorro, las personas pueden prepararse para emergencias financieras, generar inversiones a futuro y evitar endeudamientos innecesarios.",
      'El hábito de ahorrar de manera constante se ha destacado como uno de los pilares esenciales para la independencia financiera, especialmente en tiempos de incertidumbre económica. Los expertos señalan que, además del ahorro, es crucial que este porcentaje se invierta inteligentemente, ya sea en fondos de inversión, bienes raíces u otros activos que generen rendimientos. La disciplina financiera, acompañada de una estrategia de inversión adecuada, permite que cualquier persona, independientemente de su nivel de ingresos, construya riqueza con el tiempo.',
    ],
    fuentes: [],
  },
  {
    slug: 'los-negocios-pueden-arruinar-las-amistades-un-dilema-clave',
    titulo:
      '¿Los negocios pueden arruinar las amistades? Un dilema clave en el ámbito empresarial.',
    fecha: '2024-09-05',
    imagen: {
      src: '/CardNoticiasDos.jpg',
      width: 2121,
      height: 1414,
    },
    parrafos: [
      'El viejo debate sobre si los negocios pueden arruinar la amistad sigue vigente. Numerosos estudios advierten sobre los riesgos que conlleva iniciar un negocio con amigos, resaltando que, aunque la confianza y la buena relación inicial puedan parecer una ventaja, los desafíos que emergen pueden ser devastadores para la relación. Según el profesor Noam Wasserman de Harvard, equipos fundados por amigos tienen un 28.6% más de probabilidades de experimentar conflictos o rupturas, lo que a menudo resulta en la salida de uno de los socios, afectando tanto la amistad como la empresa. El problema radica en la falta de claridad en los roles y la dificultad para manejar conflictos emocionales, algo que es menos común cuando los fundadores han sido colegas previos en lugar de amigos íntimos..',
      'Otros expertos, como Nancy Rothbard de Wharton, subrayan que mezclar amistad y trabajo puede llevar a conflictos de interés o dificultades para tomar decisiones objetivas. Si bien las amistades en el entorno laboral pueden mejorar la cooperación y el ambiente general, también pueden crear tensiones cuando surgen diferencias profesionales. Rothbard aconseja que, si se opta por iniciar un negocio con amigos, es vital establecer expectativas claras desde el principio y asegurarse de que ambas partes estén dispuestas a enfrentar conversaciones difíciles de manera profesional.',
    ],
    fuentes: [
      'https://www.weforum.org/agenda/2015/12/why-friends-shouldnt-go-into-business-together/',
      'https://magazine.wharton.upenn.edu/issues/fall-winter-2018/the-dark-side-of-workplace-friendships/',
    ],
  },
  {
    slug: 'ahorros-utopia-o-realidad-breves-consejos-para-lograrlo',
    titulo: 'Ahorros: ¿utopía o realidad? Breves consejos para lograrlo',
    fecha: '2024-08-20',
    imagen: {
      src: '/CardNoticiasTres.jpg',
      width: 2121,
      height: 1414,
    },
    parrafos: [
      'Ahorrar de manera eficiente puede tener un gran impacto en tus finanzas, y existen recomendaciones validadas por expertos que lo confirman. Por ejemplo, un informe de Harvard Business Review destaca la importancia de automatizar los ahorros como una forma de asegurarse de que una parte de los ingresos siempre se destine al ahorro sin la tentación de gastarlo primero. De igual manera, estudios de la American Economic Association muestran que la planificación de presupuestos y la eliminación de deudas con altas tasas de interés son esenciales para mejorar el bienestar financiero ..',
      'Además, la Federal Trade Commission sugiere que renegociar contratos de servicios como seguros o planes telefónicos cada año puede generar ahorros considerables a lo largo del tiempo, ya que los proveedores ofrecen descuentos o promociones a clientes nuevos o que actualizan sus planes. Utilizar aplicaciones de ahorro y programas de lealtad también maximiza las oportunidades para gastar menos en productos básicos, contribuyendo a un ahorro más eficiente en el día a día .',
    ],
    fuentes: [],
  },
  {
    slug: 'polemica-por-estimacion-de-evasion-del-impuesto-corporativo-en',
    titulo: 'Polémica por estimación de evasión del impuesto corporativo en Chile',
    fecha: '2024-08-05',
    imagen: {
      src: '/CardNoticiasCuatro.jpg',
      width: 3864,
      height: 2576,
    },
    parrafos: [
      'El Ministerio de Hacienda ha anunciado que la evasión del impuesto corporativo en Chile alcanza el 50% del total de recaudación estimada, una cifra que ha causado escepticismo entre diversos expertos del ámbito fiscal. A pesar de que Chile recauda un 4,68% del PIB en impuestos corporativos, significativamente más que el promedio de la OCDE, las autoridades aún no han publicado un informe desglosado que explique claramente los factores detrás de esta evasión. Además, se destaca que la economía informal en Chile es el doble que en los países de la OCDE, lo que podría ser un factor, aunque insuficiente, para justificar la cifra de evasión tan elevada..',
      'Expertos han señalado que los métodos de cálculo utilizados en Chile, basados en un enfoque descendente, podrían estar inflando las estimaciones. En contraste, países como Canadá y Australia utilizan auditorías frecuentes para obtener cifras más precisas. Además, se ha cuestionado si se ha considerado correctamente el impacto de las PYMEs, cuya tributación es significativamente menor debido a beneficios fiscales como el régimen 14D, lo que podría afectar la tasa efectiva de evasión. Ante esta incertidumbre, algunos proponen la creación de una comisión técnica transversal que determine cifras más confiables, mientras se espera un informe oficial del SII en 2024.',
    ],
    fuentes: [],
  },
  {
    slug: 'hacienda-trabaja-en-proyecto-de-renta-se-eliminan-beneficios',
    titulo:
      'Hacienda trabaja en proyecto de renta: se eliminan beneficios y se ajustan impuestos para personas',
    fecha: '2024-07-20',
    imagen: {
      src: '/Carouselimagethree.jpg',
      width: 7008,
      height: 2810,
    },
    parrafos: [
      'El Ministerio de Hacienda se encuentra desarrollando un proyecto de reforma al sistema de renta que contempla desintegrar el régimen tributario actual y aplicar alzas de impuestos a personas con mayores ingresos. Entre las medidas propuestas destacan la creación de un nuevo régimen para PYMEs, la reducción del impuesto corporativo, y deducciones de gastos en favor de la clase media. El objetivo de la iniciativa es compensar la disminución de impuestos y fomentar la inversión y la innovación en el país. Este proyecto está generando debate, ya que se busca ajustar la recaudación por medio de nuevas medidas que impacten tanto a empresas como a personas naturales. Expertos señalan que se debe avanzar hacia un sistema tributario más progresivo y justo, en línea con las economías de los países de la OCDE. Además, se prevé que esta reforma impulse el crecimiento y simplifique el sistema tributario, pero sectores como el empresariado advierten sobre posibles desincentivos a la inversión si se eliminan ciertos beneficios.',
    ],
    fuentes: [],
  },
  {
    slug: 'sii-aclara-que-fiscalizaciones-son-programadas-y-funcionarios-deben',
    titulo: 'SII aclara que fiscalizaciones son programadas y funcionarios deben identificarse',
    fecha: '2024-07-05',
    imagen: {
      src: '/CardServiciosUno.jpg',
      width: 3862,
      height: 2578,
    },
    parrafos: [
      'El Servicio de Impuestos Internos (SII) aclaró que sus procedimientos de fiscalización en terreno se llevan a cabo de manera programada y que los funcionarios encargados deben identificarse adecuadamente. Esta declaración surge tras una denuncia sobre una supuesta visita irregular en horario nocturno por parte de fiscalizadores, quienes no habrían cumplido con los protocolos establecidos. La entidad enfatizó que las fiscalizaciones buscan garantizar el correcto cumplimiento de las obligaciones tributarias y que cualquier irregularidad debe ser reportada para su revisión. Además, el SII explicó que las fiscalizaciones siguen un protocolo riguroso, en el cual los funcionarios no solo deben presentarse con identificación visible, sino también entregar la documentación correspondiente a los contribuyentes. Las inspecciones no son sorpresivas, ya que deben ser previamente programadas y notificadas. La institución reiteró la importancia de cumplir con estos requisitos para asegurar la transparencia y legitimidad de sus actuaciones en terreno, instando a los contribuyentes a denunciar cualquier anomalía.',
    ],
    fuentes: [],
  },
]
