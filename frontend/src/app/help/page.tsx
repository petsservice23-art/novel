'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is Novelverse?',
    answer: 'Novelverse is a premier web novel reading platform where you can read captivating fantasy, romance, historical, and drama novels online. Enjoy a clean reading experience, customizable font themes, and audio narration.'
  },
  {
    question: 'Are all chapters free to read?',
    answer: 'Every novel features dozens to hundreds of completely free chapters. Advanced or completed chapters can be unlocked using Coins or accessed with VIP privileges.'
  },
  {
    question: 'How do I get coins?',
    answer: 'You can get coins easily by visiting the Coins page to purchase coin bundles, or by claiming daily reading streaks when logged in to your account.'
  },
  {
    question: 'Can I read on my phone?',
    answer: 'Yes! Novelverse is designed to be fully mobile-first and responsive. You can read smoothly across iPhones, Android devices, tablets, and desktop computers.'
  },
  {
    question: 'How do I track my reading progress?',
    answer: 'Sign in to your account and bookmark novels to your Library. Your last-read chapter and reading progress are synchronized automatically in real time.'
  },
  {
    question: 'How do I change my account settings?',
    answer: 'Open the profile drawer from the top right avatar menu and navigate to Settings. You can modify your display name, avatar, account details, and password.'
  },
  {
    question: 'What genres are available?',
    answer: 'We host a rich selection of genres including Romance, Fantasy, Josei, Historical, Mature, Drama, Action, and Supernatural. Visit the Genres tab to browse by tag.'
  },
  {
    question: 'How do I contact support?',
    answer: 'If you have any questions, encounter a bug, or need account help, feel free to contact us through our Contact page or email support@novelverse.com.'
  }
];

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '60px 20px 100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em', color: '#fff' }}>
            Help Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Frequently Asked Questions
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '60px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={faq.question}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  borderColor: isOpen ? 'var(--accent)' : 'var(--border)'
                }}
              >
                <button
                  onClick={() => toggleIndex(index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.2s',
                    color: isOpen ? 'var(--accent)' : 'var(--text-muted)'
                  }}>
                    ▲
                  </span>
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 24px 20px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '16px'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
            Contact Support
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px' }}>
            If you can’t find the answer you’re looking for, our friendly support team is always ready to assist you.
          </p>
          <Link href="/contact" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent)',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            Go to Contact Page &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
