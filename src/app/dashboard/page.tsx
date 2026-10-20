import { redirect } from 'next/navigation'

/**
 * /dashboard no tiene contenido propio: lleva al perfil. El proxy hace lo mismo, pero la
 * redirección de una Server Action (p. ej. tras el login) renderiza esta ruta sin pasar por él.
 */
export default function DashboardPage() {
  redirect('/dashboard/perfil')
}
