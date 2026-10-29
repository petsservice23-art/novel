'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import API_URL from '@/config';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { formatTimeAgo } from '@/utils/timeAgo';

const DailyRewards = () => {
  const { user, fetchUser } = useAuth();
  const [claiming, setClaiming] = useState(false);

  if (!user) return null;

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      const res = await axios.post(`${API_URL}/retention/daily-reward`);
      toast.success(res.data.message || 'Daily reward claimed!');
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reward already claimed today');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={{ 
      background: '#09090b', 
      borderRadius: '12px', 
      padding: '24px 32px', 
      marginBottom: '60px',
      border: '1px solid #27272a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '32px' }}>🎁</div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px', color: '#fafafa', letterSpacing: '-0.02em' }}>Daily Check-In</h3>
          <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
            Claim your daily bonus coins. Current streak: <span style={{ color: '#fafafa', fontWeight: '600' }}>{user.reading_streak?.current_streak || 0} days</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={handleClaimReward}
          disabled={claiming}
          style={{
            background: '#fafafa',
            color: '#09090b',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: claiming ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Claim Daily Coins
        </button>
      </div>
    </div>
  );
};

const genres = [
  { emoji: "💕", name: "Romance", count: 100 },
  { emoji: "⚔️", name: "Fantasy", count: 94 },
  { emoji: "🎭", name: "Drama", count: 76 },
  { emoji: "💄", name: "Josei", count: 42 },
  { emoji: "😂", name: "Comedy", count: 32 },
  { emoji: "📚", name: "Mature", count: 23 },
  { emoji: "🧠", name: "Psychological", count: 15 },
  { emoji: "🖤", name: "Tragedy", count: 11 }
];

const NovelCard = ({ novel }: { novel: any }) => (
  <Link href={`/novel/${novel._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'opacity 0.2s ease',
      width: '100%',
      cursor: 'pointer'
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ 
        aspectRatio: '2/3', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        position: 'relative',
        background: '#18181b',
        border: '1px solid #27272a'
      }}>
        <img 
          src={novel.cover_image} 
          alt={novel.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/400/600`; }}
        />
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '60px 16px 16px', 
          background: 'linear-gradient(to top, #09090b, transparent)', 
          pointerEvents: 'none'
        }} />
        <span style={{ 
          position: 'absolute',
          top: '12px',
          left: '12px',
          fontSize: '10px', 
          fontWeight: '600', 
          color: novel.publishing_status === 'ongoing' ? '#a1a1aa' : '#fafafa',
          background: '#09090b',
          border: '1px solid #27272a',
          padding: '4px 10px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>{novel.publishing_status}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ 
          fontSize: '15px', 
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ color: '#71717a', fontSize: '13px' }}>{novel.author && novel.author.toLowerCase() !== 'novelverse' ? novel.author : 'Unknown Author'}</span>
          <span style={{ color: '#52525b', fontSize: '11px' }}>{novel.total_chapters || 0} chapters · {formatTimeAgo(novel.updatedAt)}</span>
        </div>
      </div>
    </div>
  </Link>
);

const ContinueReading = () => {
  const { user } = useAuth();
  
  if (!user || !user.reading_history || user.reading_history.length === 0) return null;

  const recentReads = [...user.reading_history]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', letterSpacing: '-0.02em' }}>Continue Reading</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {recentReads.map((history: any, idx) => {
          const novel = history.novel_id;
          if (!novel) return null;
          return (
            <Link key={idx} href={`/novel/${novel._id}/chapter/${history.last_chapter_read}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                background: '#09090b', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                display: 'flex', 
                gap: '16px', 
                padding: '12px',
                border: '1px solid #27272a',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#18181b'}
              onMouseLeave={e => e.currentTarget.style.background = '#09090b'}
              >
                <img 
                  src={novel.cover_image} 
                  alt={novel.title} 
                  style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                  onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/200/300`; }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#fafafa', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{novel.title}</h4>
                  <p style={{ fontSize: '12px', color: '#a1a1aa' }}>Chapter {history.last_chapter_read}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default function Home() {
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const res = await axios.get(`${API_URL}/novels`);
        const data = Array.isArray(res.data) ? res.data : (res.data.novels || []);
        // Strict filter to only show completed novels
        const completedOnly = data.filter((n: any) => (n.publishing_status || '').toLowerCase() === 'completed');
        setNovels(completedOnly);
      } catch (err) {
        console.error("Failed to fetch novels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, []);

  return (
    <div style={{ paddingBottom: '80px', background: '#09090b', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Hero Spotlight Section */}
      <section style={{ 
        height: '500px', 
        width: '100%', 
        position: 'relative', 
        marginBottom: '80px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #27272a'
      }}>
        <div style={{ 
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 10, display: 'flex', gap: '60px', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '600px' }}>
            <span style={{ color: '#a1a1aa', fontWeight: '500', letterSpacing: '0.05em', fontSize: '12px', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>Featured Editor's Choice</span>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px', color: '#fafafa', letterSpacing: '-0.02em' }}>Under the Oak Tree</h1>
            <p style={{ fontSize: '16px', color: '#a1a1aa', marginBottom: '32px', lineHeight: '1.6' }}>A heart-wrenching tale of a stuttering lady and a brave knight. In a world of magic and betrayal, can love truly heal the deepest wounds?</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {novels.length > 0 && (
                <Link href={`/novel/${novels.find((n: any) => n.title.includes('Oak'))?._id || novels[0]?._id}`} style={{ background: '#fafafa', color: '#09090b', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '15px' }}>Start Reading</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        <DailyRewards />
        <ContinueReading />
        
        {/* Recently Updated */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', letterSpacing: '-0.02em' }}>Recently Updated</h2>
            <Link href="/browse" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
              View all &rarr;
            </Link>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px' }}>
            {loading ? (
              [1,2,3,4,5,6].map(i => <div key={i} style={{ aspectRatio: '2/3', background: '#18181b', borderRadius: '8px', border: '1px solid #27272a' }}></div>)
            ) : (
              novels.slice(0, 12).map((novel) => (
                <NovelCard key={novel._id} novel={novel} />
              ))
            )}
          </div>
        </section>

        {/* Browse by Genre */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '24px' }}>
             <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', letterSpacing: '-0.02em' }}>Explore Genres</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {genres.map((genre, idx) => (
              <Link key={idx} href={`/browse?genre=${genre.name}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ 
                  background: 'transparent',
                  borderRadius: '8px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  border: '1px solid #27272a',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#18181b'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: '24px' }}>{genre.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '500', color: '#fafafa', marginBottom: '2px' }}>{genre.name}</h4>
                    <p style={{ fontSize: '13px', color: '#71717a' }}>{genre.count} stories</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
