import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string; chapterNum: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string; chapterNum: string }> }): Promise<Metadata> {
  const { id, chapterNum } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://novel-production-a7e3b704.up.railway.app/api';
  
  try {
    const res = await fetch(`${apiUrl}/novels/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const novel = await res.json();
      const title = `${novel.title} - Chapter ${chapterNum} Read Online`;
      const description = `Read Chapter ${chapterNum} of ${novel.title} online for free on SegyeNovels. High quality translation with clean reader mode.`;
      
      const rawImage = novel.cover_image || '';
      const imageUrl = rawImage.startsWith('http') 
        ? rawImage 
        : `https://www.segyenovels.space${rawImage.startsWith('/') ? '' : '/'}${rawImage || 'images/logo-wordmark.png'}`;

      return {
        title,
        description,
        alternates: {
          canonical: `/novel/${id}/chapter/${chapterNum}`,
        },
        openGraph: {
          title: `${novel.title} Chapter ${chapterNum} | SegyeNovels`,
          description,
          images: [{ url: imageUrl }],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${novel.title} Chapter ${chapterNum} | SegyeNovels`,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (e) {
    // Fallback on error
  }

  return {
    title: `Chapter ${chapterNum} | SegyeNovels`,
  };
}

export default function ChapterLayout({ children }: Props) {
  return <>{children}</>;
}
