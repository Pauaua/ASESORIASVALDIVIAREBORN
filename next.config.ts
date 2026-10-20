import type { NextConfig } from 'next'
// Valida las variables de entorno al arrancar `next dev` / `next build`.
import './src/env'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
    ],
  },
}

export default nextConfig
