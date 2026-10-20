import { WhatsAppIcon } from '@/components/icons/brands'
import { whatsappUrl } from '@/content/sitio'

/** Botón flotante de WhatsApp (solo en el home). */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contáctanos vía WhatsApp (se abre en una pestaña nueva)"
      className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-brand-blue p-4 text-white shadow-lg transition duration-300 hover:bg-green-600 focus-visible:ring-4 focus-visible:ring-brand-green"
    >
      <WhatsAppIcon size={24} />
      <span className="hidden xl:block" aria-hidden="true">
        Contáctanos vía WhatsApp
      </span>
    </a>
  )
}
