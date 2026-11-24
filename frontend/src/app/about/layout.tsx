import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Discover Your Next Favourite Story',
  description: 'Learn about SegyeNovels, our mission to bring Korean and Asian web novels to English readers with a fast, modern reading platform.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
