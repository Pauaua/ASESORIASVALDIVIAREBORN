import 'server-only'
import bcrypt from 'bcryptjs'
import NextAuth, { CredentialsSignin, type DefaultSession } from 'next-auth'
import type {} from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import { env } from '@/env'
import { db } from '@/lib/db'
import { isRol, type Rol } from '@/lib/rbac'
import { loginSchema } from '@/lib/validators/auth'

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: Rol } & DefaultSession['user']
  }
  interface User {
    role: Rol
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Rol
    /** Momento (ms) en que se verificó por última vez contra la BD que la cuenta sigue activa. */
    verificadoEn: number
  }
}

/** Cada cuánto se revalida contra la BD que el usuario sigue activo y con el mismo rol. */
export const REVALIDACION_SESION_MS = 60_000

/** Login fallido por cuenta desactivada: el único caso en que se da un motivo específico. */
export class CuentaDesactivada extends CredentialsSignin {
  override code = 'cuenta_desactivada'
}

/**
 * Hash bcrypt válido de una contraseña aleatoria. Se compara contra él cuando el correo no
 * existe, para que la respuesta tarde lo mismo y no revele qué correos están registrados.
 */
const HASH_SENUELO = '$2b$10$789fDhypuSyYlAroOR.I/OK0PwiV7bNf/nun6zWPzhTmj0qicTihK'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  // No hay página /auth/error: los errores vuelven al login con ?error=…
  pages: { signIn: '/auth/login', error: '/auth/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        // Los correos se guardan en minúsculas; la búsqueda insensible cubre filas antiguas que
        // aún no se normalizaron (ver scripts/auditar-emails.ts).
        const usuario = await db.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: {
            id: true,
            email: true,
            name: true,
            lastname: true,
            password: true,
            role: true,
            active: true,
            image: true,
          },
        })

        const claveOk = await bcrypt.compare(password, usuario?.password ?? HASH_SENUELO)
        if (!usuario || !claveOk || !isRol(usuario.role)) return null
        if (!usuario.active) throw new CuentaDesactivada()

        return {
          id: String(usuario.id),
          name: `${usuario.name} ${usuario.lastname}`.trim(),
          email: usuario.email,
          image: usuario.image,
          role: usuario.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role
        token.verificadoEn = Date.now()
        return token
      }

      // Revalida contra la BD cada 60 s (o al pedir `update()`): si la cuenta se desactivó o se
      // eliminó, devolver null cierra la sesión.
      const vencido = Date.now() - (token.verificadoEn ?? 0) > REVALIDACION_SESION_MS
      if (!vencido && trigger !== 'update') return token

      const id = Number(token.id)
      if (!Number.isInteger(id)) return null
      const usuario = await db.user.findUnique({
        where: { id },
        select: { active: true, role: true, name: true, lastname: true, email: true, image: true },
      })
      if (!usuario?.active || !isRol(usuario.role)) return null

      token.role = usuario.role
      token.name = `${usuario.name} ${usuario.lastname}`.trim()
      token.email = usuario.email
      token.picture = usuario.image
      token.verificadoEn = Date.now()
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})
