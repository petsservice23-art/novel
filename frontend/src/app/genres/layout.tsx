import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Novel Genres - Fantasy, Romance, Action, Isekai',
  description: 'Discover web novels categorized by genre: Fantasy, Romance, Action, Reincarnation, Wuxia, Villainess, and more on SegyeNovels.',
  alternates: {
    canonical: '/genres',
  },
};

export default function GenresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
