'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import API_URL from '@/config';
import axios from 'axios';
import { formatTimeAgo } from '@/utils/timeAgo';

const getCleanAuthor = (author?: string) => {
  if (!author) return 'Korean Author';
  const lower = author.toLowerCase();
  if (lower.includes('novelverse') || lower.includes('segyenovels') || lower.includes('admin')) {
    return 'Korean Author';
  }
  return author;
};

// Novel Card (Strictly 2-col on mobile, 3 on small, 4 on tablet, 6 on desktop)
const NovelCard = ({ novel, badge }: { novel: any; badge?: string }) => {
  const isCompleted = (novel.publishing_status || 'completed').toLowerCase() === 'completed';
  const authorName = getCleanAuthor(novel.author);

  // Safeguard: Ensure the displayed timeline is always recent (never older than novel creation date)
  const displayDate = (novel.updatedAt && novel.createdAt && new Date(novel.updatedAt).getTime() < new Date(novel.createdAt).getTime())
    ? novel.createdAt
    : (novel.updatedAt || novel.createdAt);

  return (
    <Link href={`/novel/${novel._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'transform 0.2s ease, opacity 0.2s ease',
          width: '100%',
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.opacity = '0.94';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.opacity = '1';
        }}
      >
        {/* Cover Image Container */}
        <div style={{ 
          aspectRatio: '2/3', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <img 
            src={novel.cover_image} 
            alt={novel.title} 
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/400/600`; }}
          />

          {/* Frosted Transparent Status Tag in Top-Left (Matches Ownverso) */}
          <span style={{ 
            position: 'absolute',
            top: '6px',
            left: '6px',
            fontSize: '9px', 
            fontWeight: '700', 
            color: isCompleted ? '#0f766e' : '#047857',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: isCompleted ? '1px solid rgba(15, 118, 110, 0.3)' : '1px solid rgba(4, 120, 87, 0.3)',
            padding: '2px 7px',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10
          }}>
            {isCompleted ? 'Completed' : 'Ongoing'}
          </span>

          {badge && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              fontSize: '9px',
              fontWeight: '800',
              color: '#fff',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              padding: '2px 6px',
              borderRadius: '4px',
              zIndex: 10
            }}>
              {badge}
            </span>
          )}
        </div>

        {/* Text Container: Pure black bold title, 2 lines clamp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            lineHeight: '1.3',
            minHeight: '34px'
          }}>
            {novel.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {authorName}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '500' }}>
              {novel.total_chapters || 0} chapters · {formatTimeAgo(displayDate)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home() {
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const res = await axios.get(`${API_URL}/novels`);
        const data = Array.isArray(res.data) ? res.data : (res.data.novels || []);
        setNovels(data);
      } catch (err) {
        console.error("Failed to fetch novels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, []);

  const total = novels.length;
  const heroList = novels.slice(0, 15);
  const heroTotal = heroList.length || 1;

  // Auto slide carousel every 5 seconds
  useEffect(() => {
    if (heroTotal <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroTotal);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroTotal]);

  const prevHero = () => setHeroIndex(prev => (prev - 1 + heroTotal) % heroTotal);
  const nextHero = () => setHeroIndex(prev => (prev + 1) % heroTotal);

  const prevIndex = (heroIndex - 1 + heroTotal) % heroTotal;
  const nextIndex = (heroIndex + 1) % heroTotal;

  const activeNovel = heroList[heroIndex];
  const prevNovel = heroList[prevIndex];
  const nextNovel = heroList[nextIndex];

  // Data slices (14 items each to perfectly fill 2 rows of 7 cards without gaps)
  const newArrivals = novels.slice(0, 14);
  const recentlyUpdated = [...novels].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()).slice(0, 14);
  const topRanked = [...novels].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 14);

  return (
    <div style={{ 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      minHeight: '100vh', 
      paddingBottom: '80px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>

      {/* 1. KAKAOPAGE 3-CARD CAROUSEL (Image 1 Style: Full Cover without Cutouts) */}
      <section style={{ maxWidth: '1240px', margin: '20px auto 40px', padding: '0 16px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '100%', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {loading || !activeNovel ? (
            <div style={{ width: '280px', height: '400px', background: 'var(--bg-card)', borderRadius: '20px' }} />
          ) : (
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

              {/* Center Active Novel Card (Full Cover Artwork, Never Cutout!) */}
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
                <Link href={`/novel/${activeNovel._id}`} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
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
                    {/* Full cover image */}
                    <img 
                      src={activeNovel.cover_image} 
                      alt={activeNovel.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${activeNovel._id}/400/600`; }}
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

                    {/* Slide Counter (e.g. 11 / 17, matching Image 1) */}
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

                {/* Subtitle / CTA under active card */}
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Link href={`/novel/${activeNovel._id}`} style={{
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

              {/* Right Peeking Card (Clickable to switch) */}
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
          )}
        </div>
      </section>

      {/* 2. NOVEL GRID CONTAINERS (Strictly 2 columns on mobile, 6 on desktop) */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>

        {/* SECTION A: NEW ARRIVALS */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                New Arrivals
              </h2>
            </div>
            <Link href="/browse?sort=newest" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View all</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* Strict 2-col on mobile, up to 6 on desktop */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ aspectRatio: '2/3', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }} />
              ))
            ) : (
              newArrivals.map((novel, idx) => (
                <NovelCard key={novel._id} novel={novel} badge={idx < 2 ? 'NEW' : undefined} />
              ))
            )}
          </div>
        </section>

        {/* SECTION B: RECENTLY UPDATED */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Recently Updated
              </h2>
            </div>
            <Link href="/browse?sort=updated" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View all</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ aspectRatio: '2/3', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }} />
              ))
            ) : (
              recentlyUpdated.map((novel) => (
                <NovelCard key={novel._id} novel={novel} />
              ))
            )}
          </div>
        </section>

        {/* SECTION C: TOP RANKED (밀리언 페이지) */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Top Ranked Novels
              </h2>
            </div>
            <Link href="/browse?sort=popular" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View all</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {topRanked.map((novel, idx) => (
              <NovelCard key={novel._id} novel={novel} badge={`#${idx + 1}`} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
