import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & DMCA Compliance',
  description: 'Read the SegyeNovels Privacy Policy and DMCA Compliance guidelines. Learn how we safeguard user data and handle copyright notices.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
