import Image from 'next/image'
import { equipo } from '@/content/equipo'
import { valores } from '@/content/valores'

const BLOQUES = [
  {
    titulo: 'QUIÉNES SOMOS',
    alineacion: 'text-left',
    texto:
      'Somos Asesorías Valdivia, una firma de consultoría especializada en servicios contables, laborales, tributarios y de auditoría. Nuestro equipo está liderado por Ricardo Valdivia Salis, Contador Auditor e Ingeniero Comercial, quien aporta más de 18 años de experiencia en el sector. Nos enorgullece contar con la confianza de más de setenta empresas, que nos eligen por nuestra dedicación y compromiso con la excelencia. En Asesorías Valdivia SPA, nuestro objetivo es ofrecer soluciones integrales y personalizadas que faciliten el cumplimiento tributario y promuevan el crecimiento eficiente de nuestros clientes.',
  },
  {
    titulo: 'HISTORIA',
    alineacion: 'text-right',
    texto:
      'Impulsada durante la crisis sanitaria del COVID-19, Asesorías Valdivia fue fundada por Ricardo Valdivia Salis, Contador Auditor e Ingeniero Comercial con 18 años de experiencia en los ámbitos contable, tributario y laboral. Inicialmente, Ricardo ofreció sus servicios a empresas de conocidos y amigos, y hoy más de setenta empresas confían en nuestra pericia y dedicación. En 2021, Gabriela Oyanadel Dubost, Ingeniera en Administración de Empresas con especialización en Recursos Humanos, se unió al equipo, fortaleciendo significativamente nuestra área laboral. Actualmente seguimos comprometidos con brindar un servicio de excelencia y apoyo constante a nuestros clientes.',
  },
  {
    titulo: 'NUESTROS SERVICIOS',
    alineacion: 'text-left',
    texto:
      'En Asesorías Valdivia, ofrecemos una gama completa de servicios profesionales diseñados para satisfacer las necesidades de nuestros clientes. Nuestros servicios contables aseguran una gestión financiera precisa y eficiente, mientras que nuestros servicios laborales se centran en la administración y optimización de recursos humanos. En el ámbito tributario, proporcionamos asesoramiento experto para el cumplimiento de las obligaciones fiscales. Además, nuestras auditorías rigurosas garantizan la transparencia y exactitud de la información financiera, ayudando a las empresas a mantener altos estándares de control y cumplimiento.',
  },
  {
    titulo: 'NUESTROS CLIENTES',
    alineacion: 'text-right',
    texto:
      'En Asesorías Valdivia, atendemos a una diversa gama de clientes, que abarca desde restaurantes y empresas de ingeniería hasta empresas de marketing, transporte y marítimas, entre otros. Esta diversidad nos ha permitido adquirir una vasta experiencia en distintos tipos de contabilidades y sectores industriales. Nuestra capacidad para adaptarnos a las necesidades específicas de cada rubro nos ha consolidado como una firma de confianza para más de setenta empresas, que valoran nuestra experiencia, compromiso y dedicación al brindar soluciones eficientes y personalizadas.',
  },
] as const

/** Encabezado, credenciales del equipo y bloques de texto de /nosotros. */
export function SobreNosotros() {
  return (
    <div>
      <div aria-hidden="true" className="bg-brand-blue py-14" />
      <header className="bg-brand-blue py-8 text-center text-white">
        <h1 className="text-3xl tracking-[0.5rem] sm:text-4xl md:text-5xl lg:text-6xl">
          ASESORÍAS VALDIVIA
        </h1>
      </header>
      <div className="relative isolate w-full py-12">
        <Image src="/fondoaboutus.png" alt="" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="container mx-auto px-4 py-12">
          <section aria-label="Nuestro equipo">
            <ul className="mx-auto mb-8 grid w-full max-w-6xl grid-cols-1 items-center justify-items-center gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
              {equipo.map((miembro) => (
                <li key={miembro.imagen.src} className="w-full">
                  <Image
                    src={miembro.imagen.src}
                    alt={miembro.alt}
                    width={miembro.imagen.width}
                    height={miembro.imagen.height}
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full"
                  />
                </li>
              ))}
            </ul>
          </section>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {BLOQUES.map((bloque) => (
              <section key={bloque.titulo} className={bloque.alineacion}>
                <h2 className="mb-4 text-2xl text-brand-white md:text-3xl lg:text-4xl">
                  {bloque.titulo}
                </h2>
                <p className="px-2 text-sm text-white sm:text-base md:px-0">{bloque.texto}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Sección "NUESTROS VALORES". */
export function Valores() {
  return (
    <section aria-labelledby="titulo-valores">
      <h2
        id="titulo-valores"
        className="mb-4 px-4 py-4 text-left text-4xl text-brand-blue sm:text-5xl md:mb-8 md:py-8 md:text-6xl lg:text-8xl"
      >
        NUESTROS VALORES
      </h2>
      <ul className="flex flex-col items-center justify-around md:flex-row">
        {valores.map((valor) => (
          <li key={valor.titulo} className="mb-8 flex flex-col items-center md:mb-0 md:px-4">
            <div className="relative mb-4 size-36 sm:size-48 md:size-56 lg:size-64">
              <Image src={valor.imagen.src} alt="" fill sizes="256px" className="object-contain" />
            </div>
            <span className="sr-only">
              {valor.titulo}
              {valor.detalle ? `: ${valor.detalle}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
