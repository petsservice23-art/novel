'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';

interface Novel {
  _id: string;
  title: string;
  author: string;
  cover_image: string;
  total_chapters: number;
}

export default function LibraryPage() {
  const { user, loading } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!user) return;
      try {
        const token = document.cookie.split('jwt=')[1];
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setNovels(res.data.library || []);
      } catch (err) {
        console.error('Failed to fetch library');
      } finally {
        setFetching(false);
      }
    };
    fetchLibrary();
  }, [user]);

  if (loading || fetching) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Library...</div>;

  if (!user) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Please sign in to view your library.</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#fff' }}>My Library</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You have {novels.length} novels in your collection.</p>
      </header>

      {novels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Your library is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Start exploring our collection and add novels you love!</p>
          <Link href="/browse" style={{ 
            background: 'var(--accent)', 
            color: '#fff', 
            padding: '16px 32px', 
            borderRadius: '16px', 
            fontWeight: '800', 
            textDecoration: 'none' 
          }}>Browse Novels</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '32px' }}>
          {novels.map((novel) => (
            <Link key={novel._id} href={`/novel/${novel._id}`} style={{ textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                aspectRatio: '2/3',
                background: `url(${novel.cover_image}) center/cover`,
                borderRadius: '16px',
                border: '1px solid var(--border)',
                marginBottom: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}></div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{novel.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{novel.author}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
