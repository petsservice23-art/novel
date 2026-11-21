'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is SegyeNovels?',
      a: 'SegyeNovels is a free web novel reading platform where you can read thousands of fantasy, romance, drama, and other genre novels online. New chapters are updated daily.'
    },
    {
      q: 'Are all chapters free to read?',
      a: 'Most novels offer free chapters. Some novels have premium chapters that can be unlocked using coins. You can earn coins through daily check ins or purchase them directly.'
    },
    {
      q: 'How do I get coins?',
      a: 'You can earn free coins through daily check ins, completing tasks, or purchase coin packages from the Coins page. Coins can be used to unlock premium chapters.'
    },
    {
      q: 'Can I read on my phone?',
      a: 'Yes! SegyeNovels is fully responsive and works great on mobile browsers. You can add it to your home screen for an app-like experience.'
    },
    {
      q: 'How do I track my reading progress?',
      a: 'Your reading progress is automatically saved. Visit your Library or Dashboard to see your continue reading list and reading history.'
    },
    {
      q: 'How do I change my account settings?',
      a: 'Go to Settings from the navigation menu. You can update your profile, change your password, and manage security settings.'
    },
    {
      q: 'What genres are available?',
      a: 'SegyeNovels offers a wide range of genres including Fantasy, Romance, Drama, Comedy, Action, Reincarnation, Villainess, and many more. Browse the Genres page to explore all categories.'
    },
    {
      q: 'How do I contact support?',
      a: 'You can chat with our support team in real time via the Support Chat page or the chat button in the bottom corner. You can ask queries, attach screenshots, and share links.'
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
        
        {/* Header Block (Matching Image 6) */}
        <header style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Help Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Frequently Asked Questions
          </p>
        </header>

        {/* FAQ Accordion List (Matching Image 6) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '48px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: '700',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 22px 18px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.65',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support & Queries Box (Matching Image 6) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Support & Queries
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '14px', lineHeight: '1.6' }}>
            If you can't find the answer you're looking for, chat directly with our support team.
          </p>
          <Link href="/support" style={{
            color: 'var(--accent)',
            fontSize: '14px',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Open Live Support Chat</span>
            <span>→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
