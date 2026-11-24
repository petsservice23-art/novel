import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://novel-production-a7e3b704.up.railway.app/api';
  
  try {
    const res = await fetch(`${apiUrl}/novels/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const novel = await res.json();
      const title = `${novel.title} - Read Online All Chapters`;
      const description = novel.description 
        ? novel.description.replace(/<[^>]+>/g, '').slice(0, 160) 
        : `Read ${novel.title} translated chapters online for free on SegyeNovels.`;
      
      const rawImage = novel.cover_image || '';
      const imageUrl = rawImage.startsWith('http') 
        ? rawImage 
        : `https://segyenovels.space${rawImage.startsWith('/') ? '' : '/'}${rawImage || 'images/logo-wordmark.png'}`;

      return {
        title,
        description,
        alternates: {
          canonical: `/novel/${id}`,
        },
        openGraph: {
          title: `${novel.title} | SegyeNovels`,
          description,
          images: [{ url: imageUrl }],
          type: 'book',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${novel.title} | SegyeNovels`,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (e) {
    // Fallback on error
  }

  return {
    title: 'Read Novel Online',
  };
}

export default function NovelLayout({ children }: Props) {
  return <>{children}</>;
}
