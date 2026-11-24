import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Web Novels & Light Novels Online',
  description: 'Explore hundreds of completed and ongoing Korean web novels, fantasy, romance, martial arts, and light novels on SegyeNovels.',
  alternates: {
    canonical: '/browse',
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
