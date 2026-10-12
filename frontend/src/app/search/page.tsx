'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface Novel {
  _id: string;
  title: string;
  author: string;
  cover_image: string;
  genres: string[];
  status: string;
  rating: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    genre: 'All',
    status: 'All',
    sort: 'Latest'
  });

  const genres = ['All', 'Fantasy', 'Romance', 'System', 'Action', 'Adventure', 'Mystery'];
  const statuses = ['All', 'Ongoing', 'Completed'];
  const sorts = ['Latest', 'Popular', 'Rating'];

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/novels/search?q=${searchQuery}&genre=${filter.genre}&status=${filter.status}&sort=${filter.sort}`);
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Search failed');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filter]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or keyword..."
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border)',
              borderRadius: '20px',
              padding: '24px 32px 24px 70px',
              color: '#fff',
              fontSize: '20px',
              fontWeight: '600',
              outline: 'none',
              transition: 'all 0.3s',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '48px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <FilterGroup 
          label="Genre" 
          options={genres} 
          current={filter.genre} 
          onSelect={(v) => setFilter({...filter, genre: v})} 
        />
        <FilterGroup 
          label="Status" 
          options={statuses} 
          current={filter.status} 
          onSelect={(v) => setFilter({...filter, status: v})} 
        />
        <FilterGroup 
          label="Sort By" 
          options={sorts} 
          current={filter.sort} 
          onSelect={(v) => setFilter({...filter, sort: v})} 
        />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>Searching for the best stories...</div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>No novels found</h2>
          <p>Try different keywords or filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '32px' }}>
          {results.map((novel) => (
            <Link key={novel._id} href={`/novel/${novel._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: 'var(--bg-secondary)', 
                borderRadius: '24px', 
                border: '1px solid var(--border)', 
                padding: '24px',
                display: 'flex',
                gap: '32px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(10px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              >
                <div style={{ 
                  width: '120px', 
                  aspectRatio: '2/3', 
                  background: `url(${novel.cover_image}) center/cover`, 
                  borderRadius: '16px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {novel.genres?.map(g => (
                      <span key={g} style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px' }}>{g}</span>
                    ))}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>{novel.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '15px' }}>by <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{novel.author}</span></p>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <span style={{ color: '#FFD700', fontWeight: '800' }}>⭐ {novel.rating}</span>
                    <span style={{ color: novel.status === 'Ongoing' ? '#10b981' : '#3b82f6', fontWeight: '700', fontSize: '14px' }}>{novel.status}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, options, current, onSelect }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}:</span>
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {options.map((opt: string) => (
          <button 
            key={opt}
            onClick={() => onSelect(opt)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: current === opt ? 'var(--accent)' : 'transparent',
              color: current === opt ? '#fff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
