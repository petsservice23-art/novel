'use client';

import { useState } from 'react';
import Link from 'next/link';

const allGenres = [
  { name: "Romance", count: 100, letter: "R" },
  { name: "Fantasy", count: 94, letter: "F" },
  { name: "Drama", count: 76, letter: "D" },
  { name: "Josei", count: 42, letter: "J" },
  { name: "Comedy", count: 32, letter: "C" },
  { name: "Mature", count: 23, letter: "M" },
  { name: "Psychological", count: 15, letter: "P" },
  { name: "Adult", count: 14, letter: "A" },
  { name: "Smut", count: 12, letter: "S" },
  { name: "Mystery", count: 11, letter: "M" },
  { name: "Tragedy", count: 11, letter: "T" },
  { name: "Slice of Life", count: 10, letter: "SO" },
  { name: "Action", count: 8, letter: "A" },
  { name: "Reverse Harem", count: 8, letter: "RH" },
  { name: "Shoujo", count: 7, letter: "S" },
  { name: "Isekai", count: 6, letter: "I" },
  { name: "Revenge", count: 6, letter: "R" },
  { name: "Romance Fantasy", count: 6, letter: "RF" },
  { name: "Historical", count: 5, letter: "H" },
  { name: "Reincarnation", count: 5, letter: "R" },
  { name: "Adventure", count: 4, letter: "A" },
  { name: "Royalty", count: 4, letter: "R" },
  { name: "Contemporary", count: 3, letter: "C" },
  { name: "Mature Romance", count: 3, letter: "MR" },
  { name: "Supernatural", count: 3, letter: "S" },
  { name: "Villainess", count: 3, letter: "V" },
  { name: "Harem", count: 2, letter: "H" },
  { name: "Marriage Contract", count: 2, letter: "MC" },
  { name: "Possession", count: 2, letter: "P" },
  { name: "Thriller", count: 2, letter: "T" },
  { name: "Yandere", count: 2, letter: "Y" },
  { name: "Adult Drama", count: 1, letter: "AD" },
  { name: "Angst", count: 1, letter: "A" },
  { name: "BL", count: 1, letter: "B" },
  { name: "Contract Marriage", count: 1, letter: "CM" },
  { name: "Dark Fantasy", count: 1, letter: "DF" },
  { name: "Ecchi", count: 1, letter: "E" },
  { name: "Fantasy Romance", count: 1, letter: "FR" },
  { name: "Fluff", count: 1, letter: "F" },
  { name: "Gender Bender", count: 1, letter: "GB" },
  { name: "High Society", count: 1, letter: "HS" },
  { name: "Horror", count: 1, letter: "H" },
  { name: "Imperial Palace", count: 1, letter: "IP" },
  { name: "Regression", count: 1, letter: "R" },
  { name: "School Life", count: 1, letter: "SL" },
  { name: "Seinen", count: 1, letter: "S" },
  { name: "Transmigration", count: 1, letter: "T" },
  { name: "Western Fantasy", count: 1, letter: "WF" },
  { name: "Workplace", count: 1, letter: "W" }
];

export default function GenresPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Popular');

  const filteredGenres = allGenres.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ marginBottom: '60px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px' }}>Genres</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Explore by category and jump straight into novels you like.</p>
      </header>

      {/* Stats Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '40px', 
        background: 'var(--bg-secondary)', 
        padding: '24px 40px', 
        borderRadius: '24px', 
        border: '1px solid var(--border)',
        marginBottom: '60px'
      }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Matching Genres</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800' }}>{filteredGenres.length}</h3>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }}></div>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Total Genres</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800' }}>49</h3>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }}></div>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Genre Assignments</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800' }}>539</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Popular', 'A–Z'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSortBy(tab)}
              style={{
                background: sortBy === tab ? 'var(--accent)' : 'var(--bg-secondary)',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >{tab}</button>
          ))}
          <button style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: '10px', border: '1px solid var(--border)', fontWeight: '700', cursor: 'pointer' }}>Show Empty</button>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search genres..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '10px 40px',
              color: '#fff',
              outline: 'none'
            }}
          />
          <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      {/* Top Genres Section */}
      {!search && (
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '32px' }}>Top Genres</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {allGenres.slice(0, 6).map((genre, idx) => (
              <Link key={idx} href={`/browse?genre=${genre.name}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '24px', 
                  borderRadius: '20px', 
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div>
                    <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{genre.name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{genre.count} novels</p>
                  </div>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: 'var(--accent)' }}>{genre.letter}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Genres List */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '32px' }}>All Genres</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filteredGenres.map((genre, idx) => (
            <Link key={idx} href={`/browse?genre=${genre.name}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
                transition: 'padding-left 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.paddingLeft = '8px'}
              onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
              >
                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: 'var(--text-muted)', flexShrink: 0 }}>{genre.letter}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{genre.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{genre.count} novels</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
