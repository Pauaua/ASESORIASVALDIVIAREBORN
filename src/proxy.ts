import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { can, isRol, permisoDeRuta } from '@/lib/rbac'

/**
 * Redirecciones según sesión y rol. Es solo la primera barrera: cada página, Server Action y
 * Route Handler vuelve a verificar el permiso en el servidor.
 *
 * Al pasar por `auth()`, el callback `jwt` revalida contra la BD (cada 60 s) que la cuenta siga
 * activa y renueva la cookie: una cuenta desactivada pierde la sesión en la siguiente request.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl
  const rol = isRol(req.auth?.user?.role) ? req.auth.user.role : null

  if (pathname.startsWith('/dashboard')) {
    if (!rol) {
      const login = new URL('/auth/login', req.nextUrl)
      login.searchParams.set('callbackUrl', `${pathname}${search}`)
      return NextResponse.redirect(login)
    }
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/perfil', req.nextUrl))
    }
    const permiso = permisoDeRuta(pathname)
    if (permiso && !can(rol, permiso)) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl))
    }
    return NextResponse.next()
  }

  // Con sesión iniciada no tiene sentido volver al login ni a recuperar la contraseña.
  if (rol && (pathname === '/auth/login' || pathname === '/auth/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard/perfil', req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login', '/auth/forgot-password'],
}
