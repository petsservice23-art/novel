'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NovelItem } from '@/utils/ssrApi';

export default function HeroCarousel({ novels }: { novels: NovelItem[] }) {
  const [heroIndex, setHeroIndex] = useState(0);

  const heroList = novels.slice(0, 15);
  const heroTotal = heroList.length || 1;

  useEffect(() => {
    if (heroTotal <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroTotal);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroTotal]);

  if (!heroList || heroList.length === 0) {
    return null;
  }

  const prevHero = () => setHeroIndex(prev => (prev - 1 + heroTotal) % heroTotal);
  const nextHero = () => setHeroIndex(prev => (prev + 1) % heroTotal);

  const prevIndex = (heroIndex - 1 + heroTotal) % heroTotal;
  const nextIndex = (heroIndex + 1) % heroTotal;

  const activeNovel = heroList[heroIndex];
  const prevNovel = heroList[prevIndex];
  const nextNovel = heroList[nextIndex];

  return (
    <section style={{ maxWidth: '1240px', margin: '20px auto 40px', padding: '0 16px', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          position: 'relative'
        }}>
          {/* Left Peeking Card (Clickable to switch) */}
          {prevNovel && (
            <div 
              onClick={prevHero}
              className="hidden md:block"
              style={{
                width: '240px',
                height: '340px',
                borderRadius: '16px',
                overflow: 'hidden',
                opacity: 0.55,
                transform: 'scale(0.88) translateX(30px)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                position: 'relative',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                zIndex: 2
              }}
            >
              <img 
                src={prevNovel.cover_image} 
                alt={prevNovel.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            </div>
          )}

          {/* Center Active Novel Card */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 12px'
          }}>
            <Link href={`/novel/${activeNovel.slug || activeNovel._id}`} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <div style={{
                width: '100%',
                aspectRatio: '3/4',
                maxHeight: '440px',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)'
              }}>
                <img 
                  src={activeNovel.cover_image} 
                  alt={activeNovel.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* Gradient scrim for bottom text */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '80px 20px 20px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{
                    color: '#f59e0b',
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {activeNovel.publishing_status || 'Featured'} · {activeNovel.genres?.[0] || 'Web Novel'}
                  </span>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: '800',
                    lineHeight: '1.25',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)'
                  }}>
                    {activeNovel.title}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    {activeNovel.total_chapters || 0} chapters available
                  </p>
                </div>

                {/* Slide Counter */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: '100px',
                  zIndex: 10
                }}>
                  {heroIndex + 1} / {heroTotal}
                </div>
              </div>
            </Link>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link href={`/novel/${activeNovel.slug || activeNovel._id}`} style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Read on SegyeNovels</span>
                <span style={{ color: 'var(--accent)' }}>★</span>
              </Link>
            </div>
          </div>

          {/* Right Peeking Card */}
          {nextNovel && (
            <div 
              onClick={nextHero}
              className="hidden md:block"
              style={{
                width: '240px',
                height: '340px',
                borderRadius: '16px',
                overflow: 'hidden',
                opacity: 0.55,
                transform: 'scale(0.88) translateX(-30px)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                position: 'relative',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                zIndex: 2
              }}
            >
              <img 
                src={nextNovel.cover_image} 
                alt={nextNovel.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            </div>
          )}

          {/* Arrow navigation buttons */}
          <button 
            onClick={prevHero}
            aria-label="Previous Novel"
            style={{
              position: 'absolute',
              left: '12px',
              top: '42%',
              transform: 'translateY(-50%)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <button 
            onClick={nextHero}
            aria-label="Next Novel"
            style={{
              position: 'absolute',
              right: '12px',
              top: '42%',
              transform: 'translateY(-50%)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
