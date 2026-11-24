import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.segyenovels.space';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/favicon.ico', '/favicon*.png', '/apple-touch-icon.png', '/images/'],
      disallow: ['/admin/', '/api/', '/coins/checkout'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
