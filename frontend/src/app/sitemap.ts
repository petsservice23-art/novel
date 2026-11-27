import { MetadataRoute } from 'next';
import { API_BASE_URL } from '@/utils/ssrApi';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.segyenovels.space';

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

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${API_BASE_URL}/novels`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const rawNovels = Array.isArray(data) ? data : (data.novels || []);
      
      // Exclude unverified or hidden novels to strictly protect content rights
      const visibleNovels = rawNovels.filter((n: any) => !n.is_hidden && n.status !== 'hidden');

      dynamicRoutes = visibleNovels.flatMap((n: any) => {
        const lastMod = n.updatedAt ? new Date(n.updatedAt) : new Date(n.createdAt || Date.now());
        const routes: MetadataRoute.Sitemap = [
          {
            url: `${baseUrl}/novel/${n._id}`,
            lastModified: lastMod,
            changeFrequency: (n.publishing_status === 'completed' ? 'weekly' : 'daily') as any,
            priority: 0.85,
          }
        ];

        // Also index entry chapters (first 3 free chapters and latest chapter) for Google discovery
        const total = n.total_chapters || 0;
        const chaptersToIndex = new Set([1, 2, 3]);
        if (total > 3) chaptersToIndex.add(total);

        chaptersToIndex.forEach(chNum => {
          if (chNum <= total) {
            routes.push({
              url: `${baseUrl}/novel/${n._id}/chapter/${chNum}`,
              lastModified: lastMod,
              changeFrequency: 'weekly' as any,
              priority: 0.75,
            });
          }
        });

        return routes;
      });
    }
  } catch (e) {
    console.warn('Failed to fetch novels for dynamic sitemap:', e);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
