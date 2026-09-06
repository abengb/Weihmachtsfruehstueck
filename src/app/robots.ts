import type { MetadataRoute } from 'next'

/** Gast- und Gastgeber-Links sollen nicht in Suchmaschinen landen. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/e/' }],
  }
}
