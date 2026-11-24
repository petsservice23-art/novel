import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center & Frequently Asked Questions',
  description: 'Find answers to frequently asked questions about coin purchases, reading settings, account management, and chapter unlocks on SegyeNovels.',
  alternates: {
    canonical: '/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
