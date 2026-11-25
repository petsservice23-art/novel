import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Read Web Novels Online',
  description: 'Learn about SegyeNovels, our mission to bring popular web novels to readers worldwide with a fast, modern reading platform and daily free chapters.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
