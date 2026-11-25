import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Web Novels - Read Web Novels Online',
  description: 'Search hundreds of popular web novels by title, author, or genre on SegyeNovels. Read online with clean reader mode.',
  alternates: {
    canonical: '/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
