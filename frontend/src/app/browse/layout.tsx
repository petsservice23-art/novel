import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Web Novels - Read Web Novels Online',
  description: 'Explore hundreds of completed and ongoing web novels, fantasy, romance, martial arts, and light novels on SegyeNovels with free daily updates.',
  alternates: {
    canonical: '/browse',
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
