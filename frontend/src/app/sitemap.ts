import { MetadataRoute } from 'next';
import { API_BASE_URL } from '@/utils/ssrApi';

export const revalidate = 3600; // Revalidate sitemap every hour

export async function generateSitemaps() {
  // Split sitemaps into lightweight chunks to avoid Google timeouts:
  // 0: Core static pages + All 250+ Novel overviews (~260 URLs, <200ms)
  // 1: Key chapter discovery entry points
  return [{ id: 0 }, { id: 1 }];
}

export default async function sitemap(props: {
  id: Promise<{ id: string }> | { id: string | number } | any;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.segyenovels.space';
  const resolvedParams = props?.id ? await Promise.resolve(props.id) : null;
  const sitemapId = typeof resolvedParams === 'object' && resolvedParams !== null
    ? Number(resolvedParams.id ?? 0)
    : Number(resolvedParams ?? 0);

  if (sitemapId === 0) {
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

    try {
      const res = await fetch(`${API_BASE_URL}/novels`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const rawNovels = Array.isArray(data) ? data : (data.novels || []);
        const visibleNovels = rawNovels.filter((n: any) => !n.is_hidden && n.status !== 'hidden');

        const novelRoutes: MetadataRoute.Sitemap = visibleNovels.map((n: any) => ({
          url: `${baseUrl}/novel/${n.slug || n._id}`,
          lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(n.createdAt || Date.now()),
          changeFrequency: (n.publishing_status === 'completed' ? 'weekly' : 'daily') as any,
          priority: 0.85,
        }));

        return [...staticRoutes, ...novelRoutes];
      }
    } catch (err) {
      console.warn('Failed to fetch novels for sitemap 0:', err);
    }
    return staticRoutes;
  }

  // Sitemap 1: Key chapter entry points
  try {
    const res = await fetch(`${API_BASE_URL}/novels`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const rawNovels = Array.isArray(data) ? data : (data.novels || []);
      const visibleNovels = rawNovels.filter((n: any) => !n.is_hidden && n.status !== 'hidden');

      const chapterRoutes: MetadataRoute.Sitemap = visibleNovels.flatMap((n: any) => {
        const novelSlug = n.slug || n._id;
        const lastMod = n.updatedAt ? new Date(n.updatedAt) : new Date(n.createdAt || Date.now());
        const total = n.total_chapters || 0;
        const chaptersToIndex = new Set([1, 2, 3]);
        if (total > 3) chaptersToIndex.add(total);

        const list: MetadataRoute.Sitemap = [];
        chaptersToIndex.forEach(chNum => {
          if (chNum <= total) {
            list.push({
              url: `${baseUrl}/novel/${novelSlug}/chapter/${chNum}`,
              lastModified: lastMod,
              changeFrequency: 'weekly' as any,
              priority: 0.75,
            });
          }
        });
        return list;
      });

      return chapterRoutes;
    }
  } catch (err) {
    console.warn('Failed to fetch novels for sitemap 1:', err);
  }

  return [];
}
