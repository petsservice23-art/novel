'use client';

import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      title: 'Readers First',
      desc: 'Every decision we make starts with the reader experience. Clean layouts, fast loading, and readable typography — reading should be effortless.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
      )
    },
    {
      title: 'Author Support',
      desc: 'We believe great stories deserve great reach. SegyeNovels helps authors grow their audience and earn sustainably through our coin system.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      )
    },
    {
      title: 'Daily Updates',
      desc: "Fresh chapters, new arrivals, and ongoing series — our catalog is updated every single day so there's always something new to discover.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      )
    },
    {
      title: 'Open to All',
      desc: 'Stories are for everyone. SegyeNovels hosts novels across fantasy, romance, drama, action, sci-fi, and more, with free to read chapters for every title.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      )
    }
  ];

  return (
    <div style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      padding: '48px 16px 80px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Header Block (Matching Image 2) */}
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            About SegyeNovels
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7' }}>
            SegyeNovels is a modern web novel platform built for readers who love great stories. We bring together thousands of fantasy, romance, and drama novels — with free chapters updated daily and a seamless reading experience on any device.
          </p>
        </header>

        {/* Our Story */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Our Story
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.75', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p>
              SegyeNovels was founded by a small team of avid web novel readers who were frustrated with cluttered, slow, and ad-heavy reading sites. We wanted something better — a platform that respects your time, works beautifully on mobile, and doesn't get in the way of a great story.
            </p>
            <p>
              Since launching, we've grown into a destination for readers discovering ongoing and completed novels across every genre. Our catalog expands every day, and we're constantly improving the platform based on reader feedback.
            </p>
            <p>
              We're a small, independent team — not a large corporation. That means we move fast, listen closely, and genuinely care about the community we're building.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section style={{ marginBottom: '44px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Our Mission
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.75' }}>
            To make the world's best serialized fiction accessible to every reader — free chapters first, premium content for those who want more, and a reading experience that gets out of the way of the story.
          </p>
        </section>

        {/* What We Stand For (4 Cards Grid, Matching Image 2) */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>
            What We Stand For
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {values.map((v, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How SegyeNovels Works */}
        <section style={{ marginBottom: '44px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
            How SegyeNovels Works
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.75', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Free Chapters:</strong> Every novel on SegyeNovels includes free chapters so you can start reading immediately — no account required.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Coins & Premium Content:</strong> Some novels offer advance or premium chapters beyond the free tier. These are unlocked using Coins, SegyeNovels's virtual currency. Coins are purchased in bundles and never expire.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Status Filters:</strong> Use the 'Completed' filter to find fully-finished stories, or 'Ongoing' for titles still being released. Chapter counts and last-updated timestamps are shown on every card.
            </p>
          </div>
        </section>

        {/* Our Editorial Team */}
        <section style={{ marginBottom: '44px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Our Editorial Team
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.75' }}>
            Our editorial team reviews novels before they go live, ensuring every title meets our quality bar for formatting, story completeness, and accurate genre tagging. We're a lean team of editors and readers who take the craft of storytelling seriously. Authors or translators interested in publishing on SegyeNovels can reach out through our <Link href="/support" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Support Chat</Link>.
          </p>
        </section>

        {/* Support & Queries Card (Matching Image 2) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            fontSize: '22px',
            flexShrink: 0
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Support & Queries
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Have a question, feedback, or need assistance? <Link href="/support" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Chat with our team live</Link> or email us directly at <strong>segyenovels@gmail.com</strong>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
