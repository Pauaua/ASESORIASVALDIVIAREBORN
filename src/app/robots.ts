import type { MetadataRoute } from 'next'
import { sitio } from '@/content/sitio'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/auth/', '/api/', '/unauthorized'],
    },
    sitemap: `${sitio.url}/sitemap.xml`,
    host: sitio.url,
  }
}
