import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Support & Feedback',
  description: 'Get in touch with the SegyeNovels team for inquiries, coin issues, account help, or general reading assistance.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
