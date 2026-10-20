import type { NextConfig } from 'next'
// Valida las variables de entorno al arrancar `next dev` / `next build`.
import './src/env'

const isDev = process.env.NODE_ENV !== 'production'
// La barra de comentarios de Vercel solo se inyecta en los deploys de preview.
const isPreview = process.env.VERCEL_ENV === 'preview'

const BLOB_HOSTS = 'https://*.public.blob.vercel-storage.com'
const TURNSTILE = 'https://challenges.cloudflare.com'
const VERCEL_LIVE = isPreview ? ' https://vercel.live https://*.pusher.com wss://*.pusher.com' : ''

/**
 * CSP sin nonces (compatible con el prerenderizado parcial de Cache Components): requiere
 * 'unsafe-inline' en scripts, que Next usa para hidratar. El resto queda restringido.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${TURNSTILE}${VERCEL_LIVE}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${BLOB_HOSTS}${VERCEL_LIVE}`,
  "font-src 'self' data:",
  // Subidas directas del navegador a Vercel Blob (fotos de perfil, PDF, imágenes de noticias).
  `connect-src 'self' ${TURNSTILE} https://vercel.com https://*.blob.vercel-storage.com${isDev ? ' ws: wss:' : ''}${VERCEL_LIVE}`,
  // Mapa embebido de Google Maps en el footer y widget de Turnstile.
  `frame-src https://www.google.com https://maps.google.com ${TURNSTILE}${VERCEL_LIVE}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Imágenes de perfil ya subidas en el sitio anterior (Vercel Blob).
      { protocol: 'https', hostname: 'gk5flxbicoiece78.public.blob.vercel-storage.com' },
      // Store de Vercel Blob del proyecto nuevo (fotos de perfil e imágenes de noticias).
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async redirects() {
    return [
      // El alta de usuarios se unificó en el panel (solo ADMIN).
      { source: '/auth/register', destination: '/dashboard/usuarios/nuevo', permanent: true },
      { source: '/auth/error', destination: '/auth/login', permanent: true },
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
