'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import API_URL from '@/config';

interface GenreItem {
  name: string;
  count: number;
  letter: string;
}

export default function GenresPage() {
  const [genresList, setGenresList] = useState<GenreItem[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(1172);
  const [totalNovels, setTotalNovels] = useState(250);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Popular');

  useEffect(() => {
    const fetchGenreStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/novels`);
        const novels: any[] = Array.isArray(res.data) ? res.data : (res.data.novels || []);
        setTotalNovels(novels.length);

        const counts: Record<string, number> = {};
        let assignments = 0;

        novels.forEach(n => {
          (n.genres || []).forEach((g: string) => {
            const clean = g.trim();
            if (clean) {
              counts[clean] = (counts[clean] || 0) + 1;
              assignments++;
            }
          });
        });

        setTotalAssignments(assignments);

        const list: GenreItem[] = Object.entries(counts).map(([name, count]) => {
          const letter = name.slice(0, 2).toUpperCase();
          return { name, count, letter: letter.length > 1 ? letter[0] : letter };
        });

        // Default sort by popularity
        list.sort((a, b) => b.count - a.count);
        setGenresList(list);
      } catch (err) {
        console.error('Failed to fetch real genres:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGenreStats();
  }, []);

  let filtered = genresList.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === 'A–Z') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'Popular') {
    filtered = [...filtered].sort((a, b) => b.count - a.count);
  }

  const topGenres = genresList.slice(0, 6);

  return (
    <div style={{ 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      minHeight: '100vh', 
      padding: '40px 16px 80px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Header Block (Matching Image 2) */}
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Novel Genres
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '880px', lineHeight: '1.6' }}>
            SegyeNovels hosts web novels across {genresList.length || 43} genres — from epic fantasy and slow-burn romance to fast-paced action, psychological thriller, and slice of life. Every genre has free chapters available so you can try before you commit.
          </p>
        </header>

        {/* 1. Genres Tag Cloud (Real counts from our novels!) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '32px'
        }}>
          {genresList.map((genre) => (
            <Link key={genre.name} href={`/browse?genre=${genre.name}`} style={{ textDecoration: 'none' }}>
              <span style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
              }}
              >
                <span>{genre.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({genre.count})</span>
              </span>
            </Link>
          ))}
        </div>

        {/* 2. Filter Tabs & Search Box & Live Stats */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Popular', 'A–Z', 'Show Empty'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSortBy(tab)}
                  style={{
                    background: sortBy === tab ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: sortBy === tab ? '#fff' : 'var(--text-primary)',
                    border: '1px solid ' + (sortBy === tab ? 'var(--text-primary)' : 'var(--border)'),
                    padding: '8px 18px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <input
                type="text"
                placeholder="Search genres..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '9px 18px 9px 40px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
            </div>
          </div>

          {/* Stats Bar (Live calculated from our 250 novels) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            borderTop: '1px solid var(--border)',
            paddingTop: '20px'
          }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Matching Genres</p>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{filtered.length}</h3>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Genres</p>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{genresList.length || 43}</h3>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Genre Assignments</p>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{totalAssignments.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* 3. Top Genres Section (Top 6 real genres from our database) */}
        {!search && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px', letterSpacing: '-0.01em' }}>
              Top Genres
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {topGenres.map((genre) => (
                <Link key={genre.name} href={`/genres/${encodeURIComponent(genre.name.toLowerCase().trim().replace(/\s+/g, '-'))}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '22px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                  >
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {genre.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {genre.count} novels
                      </p>
                    </div>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '800',
                      color: 'var(--accent)'
                    }}>
                      {genre.letter}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. All Genres Section (4-column card grid with arrow, matching Image 2) */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px', letterSpacing: '-0.01em' }}>
            All Genres
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {filtered.map((genre) => (
              <Link key={genre.name} href={`/genres/${encodeURIComponent(genre.name.toLowerCase().trim().replace(/\s+/g, '-'))}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: 'var(--accent)',
                    flexShrink: 0
                  }}>
                    {genre.letter}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {genre.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {genre.count} novels
                    </p>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* View All Novels Button */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/browse" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '12px 28px',
            borderRadius: '100px',
            color: 'var(--text-primary)',
            fontWeight: '700',
            fontSize: '14px',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background 0.15s'
          }}>
            <span>View all novels</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
