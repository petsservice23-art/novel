'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { formatTimeAgo } from '@/utils/timeAgo';

interface Novel {
  _id: string;
  slug?: string;
  title: string;
  author: string;
  cover_image: string;
  status: string;
  publishing_status?: string;
  genres: string[];
  total_chapters?: number;
  updatedAt?: string;
  createdAt?: string;
}

const getCleanAuthor = (author?: string) => {
  if (!author) return 'Korean Author';
  const lower = author.toLowerCase();
  if (lower.includes('novelverse') || lower.includes('segyenovels') || lower.includes('admin')) {
    return 'Korean Author';
  }
  return author;
};

export default function BrowsePage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recently Updated');
  
  // Pagination State: 24 Novels per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const res = await axios.get(`${API_URL}/novels`);
        const data = Array.isArray(res.data) ? res.data : [];
        setNovels(data);
      } catch (err) {
        console.error('Failed to fetch novels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, [API_URL]);

  const genres = [
    'All', 'Romance', 'Fantasy', 'Drama', 'Josei', 'Mature', 'Comedy', 'Smut', 'Adult', 'Psychological', 'Action', 'Isekai'
  ];

  // Apply Filters
  let filtered = novels.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (n.author && n.author.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenre = selectedGenre === 'All' || (n.genres && n.genres.includes(selectedGenre));
    
    const novelPubStatus = (n.publishing_status || 'completed').toLowerCase();
    const matchesStatus = statusFilter === 'All' || novelPubStatus === statusFilter.toLowerCase();
    
    return matchesSearch && matchesGenre && matchesStatus;
  });

  // Apply Sorting
  filtered = filtered.sort((a, b) => {
    if (sortBy === 'Recently Updated') return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    if (sortBy === 'Popular') return (b.total_chapters || 0) - (a.total_chapters || 0);
    if (sortBy === 'A-Z') return a.title.localeCompare(b.title);
    if (sortBy === 'Z-A') return b.title.localeCompare(a.title);
    if (sortBy === 'Chapters') return (b.total_chapters || 0) - (a.total_chapters || 0);
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedNovels = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, statusFilter, sortBy]);

  return (
    <div style={{ 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)',
      minHeight: '100vh', 
      padding: '24px 16px 80px', 
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* 1. Large Search Pill Input (Matching Image 4 & 5) */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search novels, authors, or genres..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '14px 20px 14px 48px',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.2s'
            }}
          />
          <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. Genre Chips Bar (Matching Image 4) */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {genres.map(genre => {
            const isActive = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  border: '1px solid ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                  padding: '7px 16px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* 3. Controls Bar: Sort Dropdown & Status Dropdown (Matching Image 4) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '8px 32px 8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                <option value="Recently Updated">Sort by: Recently Updated</option>
                <option value="Popular">Sort by: Popular</option>
                <option value="A-Z">Sort by: Title A–Z</option>
                <option value="Chapters">Sort by: Most Chapters</option>
              </select>
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            {/* Status Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '8px 32px 8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                <option value="All">Status: All Statuses</option>
                <option value="Completed">Completed Only</option>
                <option value="Ongoing">Ongoing Only</option>
              </select>
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Novels Count Indicator (Matching Image 4 & 5) */}
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{filtered.length}</span> novels found · PAGE {currentPage} OF {totalPages}
          </div>
        </div>

        {/* 4. Responsive Novel Grid (6 cols on Desktop, 2 cols on Mobile) */}
        {loading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '2/3', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : paginatedNovels.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>No novels matched your filters</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Try resetting your search query or genre filter.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedGenre('All'); setStatusFilter('All'); }}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '100px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {paginatedNovels.map((novel) => {
              const isCompleted = (novel.publishing_status || 'completed').toLowerCase() === 'completed';
              const authorName = getCleanAuthor(novel.author);
              const displayDate = (novel.updatedAt && novel.createdAt && new Date(novel.updatedAt).getTime() < new Date(novel.createdAt).getTime())
                ? novel.createdAt
                : (novel.updatedAt || novel.createdAt);

              return (
                <Link key={novel._id} href={`/novel/${novel.slug || novel._id}`} style={{ textDecoration: 'none' }}>
                  <div 
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, opacity 0.2s ease'
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
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
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

                      {/* Vignette Shadow on Bottom */}
                      <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: '40px 12px 10px', 
                        background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', 
                        pointerEvents: 'none'
                      }} />

                      {/* Status Tag on Top-Left (NO chapter count on cover!) */}
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: isCompleted ? '#0f766e' : '#047857',
                        background: 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: isCompleted ? '1px solid rgba(15, 118, 110, 0.3)' : '1px solid rgba(4, 120, 87, 0.3)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        zIndex: 10
                      }}>
                        {isCompleted ? 'Completed' : 'Ongoing'}
                      </span>
                    </div>

                    {/* Novel Metadata below cover */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--text-primary)', /* Pure black text */
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.35',
                        minHeight: '36px'
                      }}>
                        {novel.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            })}
          </div>
        )}

        {/* 5. Pagination Controls (Matching Image 4) */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '48px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let pageNum = currentPage;
              if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: isCurrent ? 'var(--accent)' : 'var(--bg-card)',
                    color: isCurrent ? '#fff' : 'var(--text-primary)',
                    border: '1px solid ' + (isCurrent ? 'var(--accent)' : 'var(--border)'),
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isCurrent ? '800' : '600'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
