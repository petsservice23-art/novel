import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Web Novels & Light Novels',
  description: 'Search hundreds of translated Korean and Asian web novels by title, author, or genre on SegyeNovels.',
  alternates: {
    canonical: '/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
