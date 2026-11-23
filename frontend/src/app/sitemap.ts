import { MetadataRoute } from 'next';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://segyenovels.space';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://novel-production-a7e3b704.up.railway.app/api';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/genres`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/coins`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let novelRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${apiUrl}/novels`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const novels = Array.isArray(data) ? data : (data.novels || []);

      novelRoutes = novels.map((n: any) => ({
        url: `${baseUrl}/novel/${n._id}`,
        lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(n.createdAt || Date.now()),
        changeFrequency: n.publishing_status === 'completed' ? 'weekly' : 'daily',
        priority: 0.85,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch novels for dynamic sitemap:', error);
  }

  return [...staticRoutes, ...novelRoutes];
}
