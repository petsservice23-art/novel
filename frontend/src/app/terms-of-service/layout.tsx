import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Review the SegyeNovels Terms of Service governing platform usage, account rules, coin purchases, and reading access.',
  alternates: {
    canonical: '/terms-of-service',
  },
};

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
