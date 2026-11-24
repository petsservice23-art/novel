import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Coins - Unlock Premium Web Novel Chapters',
  description: 'Purchase SegyeNovels coins securely via Razorpay or PayPal to unlock premium novel chapters with permanent lifetime access.',
  alternates: {
    canonical: '/coins',
  },
};

export default function CoinsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
