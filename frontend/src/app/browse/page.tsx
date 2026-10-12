'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

interface Novel {
  _id: string;
  title: string;
  author: string;
  cover_image: string;
  status: string;
  publishing_status?: string;
  genres: string[];
  total_chapters?: number;
}

export default function BrowsePage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [sortBy, setSortBy] = useState('A-Z'); // A-Z, Z-A, Chapters
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const res = await axios.get(`${API_URL}/novels`);
        const data = Array.isArray(res.data) ? res.data : [];
        const completedOnly = data.filter((n: any) => (n.publishing_status || '').toLowerCase() === 'completed');
        setNovels(completedOnly);
      } catch (err) {
        console.error('Failed to fetch novels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, [API_URL]);

  const genres = ['All', 'Fantasy', 'Romance', 'System', 'Action', 'Adventure', 'Mystery', 'Drama', 'Josei', 'Mature', 'Adult', 'Smut'];

  // Apply Filters
  let processedNovels = novels.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (n.author && n.author.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenre = genreFilter === 'All' || (n.genres && n.genres.includes(genreFilter));
    
    return matchesSearch && matchesGenre;
  });

  // Apply Sorting
  processedNovels = processedNovels.sort((a, b) => {
    if (sortBy === 'A-Z') return a.title.localeCompare(b.title);
    if (sortBy === 'Z-A') return b.title.localeCompare(a.title);
    if (sortBy === 'Chapters') return (b.total_chapters || 0) - (a.total_chapters || 0);
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(processedNovels.length / itemsPerPage);
  const paginatedNovels = processedNovels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, genreFilter, sortBy]);

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', padding: '60px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#fafafa', marginBottom: '8px', letterSpacing: '-0.02em' }}>Explore Library</h1>
          <p style={{ color: '#a1a1aa', fontSize: '15px' }}>Discover stories across all genres.</p>
        </header>

        {/* Filter Bar Controls */}
        <div style={{ 
          background: '#18181b', 
          border: '1px solid #27272a', 
          borderRadius: '12px', 
          padding: '24px',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Top Row: Search & Dropdowns */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search by title or author..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {/* Sort Filter */}
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '12px 16px', background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="A-Z">Sort: A to Z</option>
              <option value="Z-A">Sort: Z to A</option>
              <option value="Chapters">Sort: Most Chapters</option>
            </select>
          </div>

          {/* Bottom Row: Genre Pills */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {genres.map(g => (
              <button 
                key={g} 
                onClick={() => setGenreFilter(g)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: genreFilter === g ? '#fafafa' : '#27272a',
                  background: genreFilter === g ? '#fafafa' : 'transparent',
                  color: genreFilter === g ? '#09090b' : '#a1a1aa',
                  fontWeight: '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#a1a1aa' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>📚</div>
            <div>Loading novels...</div>
          </div>
        ) : paginatedNovels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#a1a1aa' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>😔</div>
            <div>No novels found matching your filters.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', color: '#a1a1aa', fontSize: '14px' }}>
              <span>Showing {paginatedNovels.length} of {processedNovels.length} novels</span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '24px' 
            }}>
              {paginatedNovels.map((novel) => {
                const displayAuthor = novel.author && novel.author.toLowerCase() !== 'novelverse' 
                  ? novel.author 
                  : 'Unknown Author';

                return (
                  <Link key={novel._id} href={`/novel/${novel._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'opacity 0.2s ease',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid #27272a', background: '#18181b' }}>
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#09090b',
                          color: '#fafafa',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          border: '1px solid #27272a',
                          zIndex: 10
                        }}>
                          {novel.total_chapters || 0} Ch.
                        </div>

                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#09090b',
                          color: (novel.publishing_status || '').toLowerCase() === 'completed' ? '#10b981' : '#3b82f6',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          border: '1px solid #27272a',
                          textTransform: 'uppercase',
                          zIndex: 10
                        }}>
                          {novel.publishing_status || 'Ongoing'}
                        </div>

                        <div style={{
                          aspectRatio: '2/3',
                          background: `url(${novel.cover_image}) center/cover`,
                          backgroundColor: '#18181b'
                        }}></div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#fafafa', 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.4'
                        }}>
                          {novel.title}
                        </h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ color: '#71717a', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            {displayAuthor}
                          </p>
                          <span style={{ color: '#a1a1aa', fontSize: '11px', padding: '2px 6px', border: '1px solid #27272a', borderRadius: '4px' }}>
                            {novel.genres?.[0] || 'Novel'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '60px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    background: currentPage === 1 ? 'transparent' : '#fafafa',
                    color: currentPage === 1 ? '#71717a' : '#09090b',
                    fontWeight: '500',
                    fontSize: '14px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Previous
                </button>
                
                <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: '500' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    background: currentPage === totalPages ? 'transparent' : '#fafafa',
                    color: currentPage === totalPages ? '#71717a' : '#09090b',
                    fontWeight: '500',
                    fontSize: '14px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
