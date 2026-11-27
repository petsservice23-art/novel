// Central SSR & Client API configuration
const getApiBaseUrl = () => {
  if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // When running on server in production or when local backend is not present, use Railway live backend
  if (process.env.NODE_ENV === 'production' || !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return 'https://novel-production-a7e3b704.up.railway.app/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export interface NovelItem {
  _id: string;
  title: string;
  author: string;
  description?: string;
  cover_image: string;
  status: string;
  is_hidden?: boolean;
  publishing_status?: string;
  genres: string[];
  total_chapters?: number;
  rating?: number;
  ratings_count?: number;
  views?: number;
  reads?: number;
  alternative_titles?: string;
  published_year?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ChapterItem {
  _id?: string;
  chapter_number: number;
  title: string;
  content?: string | string[];
  is_locked?: boolean;
  price?: number;
  tier?: string;
  chapterId?: string;
  createdAt?: string;
}

export async function fetchAllNovels(): Promise<NovelItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/novels`, {
      next: { revalidate: 120 } // Revalidate every 2 minutes
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: NovelItem[] = Array.isArray(data) ? data : (data.novels || []);
    // Filter out hidden novels to respect content rights
    return list.filter(n => !n.is_hidden && n.status !== 'hidden');
  } catch (err) {
    console.error('SSR fetchAllNovels error:', err);
    return [];
  }
}

export async function fetchNovelById(id: string): Promise<NovelItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/novels/${id}`, {
      next: { revalidate: 120 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.message || !data.title) return null;
    return data;
  } catch (err) {
    console.error(`SSR fetchNovelById(${id}) error:`, err);
    return null;
  }
}

export async function fetchNovelChapters(novelId: string): Promise<ChapterItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/chapters/novel/${novelId}`, {
      next: { revalidate: 120 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.sort((a, b) => a.chapter_number - b.chapter_number);
  } catch (err) {
    console.error(`SSR fetchNovelChapters(${novelId}) error:`, err);
    return [];
  }
}

export async function fetchChapterByNum(
  novelId: string, 
  chapterNum: string | number, 
  cookieHeader?: string | null
): Promise<ChapterItem | null> {
  try {
    const headers: Record<string, string> = {};
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${API_BASE_URL}/chapters/novel/${novelId}/chapter/${chapterNum}`, {
      headers,
      cache: 'no-store'
    });

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      return {
        chapter_number: Number(chapterNum),
        title: data.title || `Chapter ${chapterNum}`,
        is_locked: true,
        price: data.price || 10,
        tier: data.tier || 'coin',
        chapterId: data.chapterId || ''
      };
    }

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`SSR fetchChapterByNum error:`, err);
    return null;
  }
}
