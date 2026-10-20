import { Footer } from '@/components/site/footer'
import { Navbar } from '@/components/site/navbar'

/** Estructura del sitio público: navbar fija, contenido y footer. */
export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Navbar />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  )
}
