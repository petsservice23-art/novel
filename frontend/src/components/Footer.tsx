'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#0a0a0b', borderTop: '1px solid var(--border)', padding: '80px 20px 40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '80px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>Novelverse</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px' }}>
            Read fantasy and romance novels online. Free chapters, premium content, and a clean reading experience.
          </p>
        </div>
        <div>
          <h4 style={{ fontWeight: '800', marginBottom: '24px', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px', color: 'var(--text-muted)' }}>Explore</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <FooterLink text="Browse Novels" href="/browse" />
            <FooterLink text="Genres" href="/genres" />
            <FooterLink text="Coins & VIP" href="/coins" />
            <FooterLink text="Contact Us" href="/contact" />
          </div>
        </div>
        <div>
          <h4 style={{ fontWeight: '800', marginBottom: '24px', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px', color: 'var(--text-muted)' }}>Community</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <FooterLink text="My Library" href="/library" />
            <FooterLink text="Search" href="/search" />
            <FooterLink text="Profile" href="/profile" />
          </div>
        </div>
        <div>
          <h4 style={{ fontWeight: '800', marginBottom: '24px', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px', color: 'var(--text-muted)' }}>Legal</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <FooterLink text="Privacy Policy" href="/privacy-policy" />
            <FooterLink text="Terms of Service" href="/terms-of-service" />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
        © 2026 Novelverse. All rights reserved.
      </div>
    </footer>
  );
}

const FooterLink = ({ text, href }: { text: string, href: string }) => (
  <Link href={href} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} 
    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
  >
    {text}
  </Link>
);

