'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API_URL from '@/config';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatTimeAgo } from '@/utils/timeAgo';

export default function NovelDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, fetchUser } = useAuth();
  
  const [novel, setNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpToChapter, setJumpToChapter] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [savingLibrary, setSavingLibrary] = useState(false);

  useEffect(() => {
    fetchUser();
    const fetchData = async () => {
      try {
        const novelRes = await fetch(`${API_URL}/novels/${id}`);
        const novelData = await novelRes.json();
        
        if (novelData.message) {
          setNovel(null);
          setLoading(false);
          return;
        }

        setNovel(novelData);
        if (novelData?.title) {
          document.title = `${novelData.title} - Read Online Free All Chapters | Novelverse`;
        }

        const chaptersRes = await fetch(`${API_URL}/chapters/novel/${id}`);
        const chaptersData = await chaptersRes.json();
        if (Array.isArray(chaptersData)) {
          const sortedChapters = chaptersData.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
          setChapters(sortedChapters);
        } else {
          setChapters([]);
        }
      } catch (err) {
        console.error("Error fetching novel details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>Loading...</div>;
  if (!novel) return <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>Novel Not Found</div>;

  const sortedChapters = [...chapters].sort((a, b) => 
    sortAsc ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number
  );

  const filteredChapters = sortedChapters.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.chapter_number.toString().includes(searchQuery)
  );

  const isInLibrary = user?.library?.some((item: any) => 
    (typeof item === 'string' ? item : item?._id) === id
  );

  const handleToggleLibrary = async () => {
    if (!user) {
      toast.error('Please sign in to add this novel to your library');
      router.push('/login');
      return;
    }
    setSavingLibrary(true);
    try {
      const res = await axios.post(`${API_URL}/auth/library/${id}`, {}, { withCredentials: true });
      toast.success(res.data.message || (res.data.isAdded ? 'Added to library' : 'Removed from library'));
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update library');
    } finally {
      setSavingLibrary(false);
    }
  };

  const chaptersPerPage = 50;
  const numRanges = Math.ceil(filteredChapters.length / chaptersPerPage);
  const validActiveRange = activeRange >= numRanges && numRanges > 0 ? numRanges - 1 : activeRange;
  const displayedChapters = filteredChapters.slice(validActiveRange * chaptersPerPage, (validActiveRange + 1) * chaptersPerPage);

  // Checks if this paid chapter was specifically purchased/unlocked by the user with coins
  const isPaidChapterUnlockedByUser = (ch: any) => {
    if (!user || ch.tier === 'free') return false;
    const chIdStr = ch._id?.toString();
    return (user.unlocked_chapters || []).some((unlocked: any) => {
      const uId = typeof unlocked === 'string' ? unlocked : (unlocked?._id || unlocked?.toString());
      return uId === chIdStr;
    });
  };

  const freeCount = chapters.filter(c => c.tier === 'free').length;
  const lockedCount = chapters.length - freeCount;
  const userUnlockedPaidCount = chapters.filter(c => c.tier !== 'free' && isPaidChapterUnlockedByUser(c)).length;

  return (
    <div style={{ minHeight: '100vh', background: '#121212', color: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Schema.org Book JSON-LD for Search Engine Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "name": novel.title,
            "author": {
              "@type": "Person",
              "name": novel.author || "Novelverse"
            },
            "description": novel.description,
            "genre": novel.genres,
            "datePublished": novel.published_year || "2024",
            "numberOfPages": novel.total_chapters,
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": novel.rating || 4.5,
              "ratingCount": novel.ratings_count || 100
            }
          })
        }}
      />
      
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 20px', fontSize: '13px', color: '#71717a' }}>
        <Link href="/" style={{ color: '#71717a', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 8px' }}>&gt;</span>
        <Link href="/browse" style={{ color: '#71717a', textDecoration: 'none' }}>Novels</Link>
        <span style={{ margin: '0 8px' }}>&gt;</span>
        <span style={{ color: '#fafafa' }}>{novel.title}</span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Cover Image */}
        <div style={{ width: '260px', height: '380px', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <img 
            src={novel.cover_image} 
            alt={novel.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/400/600`; }}
          />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.02em', fontFamily: 'Merriweather, serif' }}>{novel.title}</h1>
        
        {/* Alternate / Original Title Area */}
        <div style={{ color: '#a1a1aa', textAlign: 'center', fontSize: '14px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontStyle: 'italic', color: '#fafafa', fontSize: '15px' }}>{novel.title.split(' ')[0].toUpperCase()}</span>
          {novel.alternative_titles && <span>Also known as: {novel.alternative_titles}</span>}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={badgeStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {novel.published_year || '2024'}
          </div>
          <div style={{ ...badgeStyle, color: novel.publishing_status === 'completed' ? '#3b82f6' : '#34d399', background: 'rgba(255,255,255,0.05)' }}>
            {novel.publishing_status === 'completed' ? 'Completed' : 'Ongoing'}
          </div>
          <div style={badgeStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            {novel.total_chapters} chapters
          </div>
          <div style={{ ...badgeStyle, color: '#34d399' }}>
            {freeCount} free chapters
          </div>
          {userUnlockedPaidCount > 0 && (
            <div style={{ ...badgeStyle, color: '#60a5fa', borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              ✓ {userUnlockedPaidCount} unlocked with ©
            </div>
          )}
        </div>

        {/* Short Meta Text */}
        <p style={{ color: '#a1a1aa', textAlign: 'center', fontSize: '14px', lineHeight: '1.6', maxWidth: '700px', marginBottom: '32px' }}>
          <i>{novel.title}</i> is written by <b>{novel.author || 'Novelverse'}</b> and was first published in {novel.published_year || '2024'}. It is a {novel.genres?.join(', ') || 'Novel'} novel with {novel.total_chapters} chapters available on Novelverse. The story is {novel.publishing_status === 'completed' ? 'complete.' : 'ongoing. New chapters are updated regularly.'}
        </p>

        {/* Genres */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
          {novel.genres?.map((g: string) => (
            <span key={g} style={tagStyle}>{g}</span>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px', marginBottom: '60px' }}>
          <Link href={`/novel/${id}/chapter/1`} style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#749275', 
              color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Read Now
            </button>
          </Link>
          <button 
            onClick={handleToggleLibrary}
            disabled={savingLibrary}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '12px', 
              border: isInLibrary ? '1px solid #749275' : '1px solid #27272a', 
              background: isInLibrary ? 'rgba(116, 146, 117, 0.15)' : 'transparent', 
              color: isInLibrary ? '#749275' : '#fafafa', 
              fontSize: '15px', fontWeight: '600', cursor: savingLibrary ? 'wait' : 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isInLibrary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {savingLibrary ? 'Updating...' : isInLibrary ? 'In Library ✓' : 'Add to Library'}
          </button>
          <button 
            onClick={() => document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #27272a', background: 'transparent', 
              color: '#fafafa', fontSize: '15px', fontWeight: '500', cursor: 'pointer' 
            }}
          >
            All Chapters
          </button>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
            {user ? (isInLibrary ? 'Saved to your personal collection' : 'Click to save to your collection') : 'Sign in to save this novel'}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', background: '#27272a', marginBottom: '40px' }}></div>

        {/* Synopsis Section */}
        <div style={{ width: '100%', textAlign: 'left', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Synopsis</h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
            {novel.description}
          </p>
        </div>

        {/* Tags Section */}
        {novel.tags && novel.tags.length > 0 && (
          <div style={{ width: '100%', textAlign: 'left', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Tags</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {novel.tags.map((t: string) => (
                <span key={t} style={tagStyle}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Chapters Header Section */}
        <div id="chapters-section" style={{ width: '100%', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Chapters <span style={{ color: '#71717a', fontSize: '14px', fontWeight: '400' }}>({chapters.length})</span></h2>
        </div>

        {/* Chapter Controls Row */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Chapters <span style={{ color: '#71717a', fontSize: '14px', fontWeight: '400' }}>({chapters.length})</span></h3>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {(lockedCount * 10).toLocaleString()} <span style={{ fontWeight: '800' }}>©</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => toast('To unlock all chapters at once, purchase a coin bundle or VIP Pass in the Coins store!', { icon: '©' })}
              style={{ background: 'transparent', border: '1px solid #f97316', color: '#f97316', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              Unlock All
            </button>
            <span style={{ fontSize: '13px', color: '#71717a' }}>Showing {Math.min(filteredChapters.length, chaptersPerPage)} of {filteredChapters.length}</span>
          </div>
        </div>

        {/* Chapter Search / Filter Row */}
        <div style={{ width: '100%', display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => { setActiveRange(0); document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={circleBtnStyle}
            >
              First
            </button>
            <button 
              onClick={() => { setActiveRange(Math.max(0, numRanges - 1)); document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={circleBtnStyle}
            >
              Last
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Search chapters by title or number..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveRange(0); }}
              style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'transparent', border: '1px solid #27272a', borderRadius: '20px', color: '#fafafa', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? "Sort: Ascending (Click for Descending)" : "Sort: Descending (Click for Ascending)"}
              style={{ 
                ...circleBtnStyle, 
                padding: '0 12px',
                background: !sortAsc ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: !sortAsc ? '#749275' : '#27272a'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
            </button>
            <input 
              type="number" 
              placeholder="Go to #" 
              value={jumpToChapter}
              onChange={(e) => setJumpToChapter(e.target.value)}
              style={{ width: '80px', padding: '10px 16px', background: 'transparent', border: '1px solid #27272a', borderRadius: '20px', color: '#fafafa', fontSize: '14px', outline: 'none' }}
            />
            <button 
              onClick={() => { if(jumpToChapter) window.location.href = `/novel/${id}/chapter/${jumpToChapter}`; }}
              style={circleBtnStyle}
            >Go</button>
          </div>
        </div>

        {/* Chapters List */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          {displayedChapters.map((chapter: any, index: number) => (
            <Link key={chapter._id} href={`/novel/${id}/chapter/${chapter.chapter_number}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: index !== displayedChapters.length - 1 ? '1px solid #27272a' : 'none',
                background: 'transparent',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#a1a1aa', width: '30px', textAlign: 'right' }}>{chapter.chapter_number}</span>
                  <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: '500' }}>{chapter.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#71717a' }}>{formatTimeAgo(chapter.createdAt || novel.updatedAt)}</span>
                  {chapter.tier === 'free' ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#34d399',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      FREE
                    </span>
                  ) : isPaidChapterUnlockedByUser(chapter) ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#60a5fa',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ✓ UNLOCKED
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#f59e0b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      10 <span style={{ fontWeight: '800' }}>©</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {displayedChapters.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#71717a', fontSize: '14px' }}>
              No chapters found matching your search.
            </div>
          )}
        </div>

        {/* Pagination Block (Screenshot accurate) */}
        {numRanges > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
            <button 
              onClick={() => setActiveRange(Math.max(0, activeRange - 1))}
              disabled={activeRange === 0}
              style={{ background: 'transparent', border: 'none', color: activeRange === 0 ? '#3f3f46' : '#a1a1aa', fontSize: '14px', cursor: activeRange === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              Previous
            </button>

            {Array.from({ length: numRanges }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveRange(i)}
                style={{
                  background: activeRange === i ? '#5e8b60' : 'transparent',
                  color: activeRange === i ? '#fff' : '#a1a1aa',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setActiveRange(Math.min(numRanges - 1, activeRange + 1))}
              disabled={activeRange === numRanges - 1}
              style={{ background: 'transparent', border: 'none', color: activeRange === numRanges - 1 ? '#3f3f46' : '#a1a1aa', fontSize: '14px', cursor: activeRange === numRanges - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// Reusable Styles for badges and buttons
const badgeStyle = {
  background: 'rgba(255,255,255,0.05)',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '500',
  color: '#a1a1aa',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const tagStyle = {
  border: '1px solid #27272a',
  padding: '6px 16px',
  borderRadius: '20px',
  fontSize: '12px',
  color: '#a1a1aa',
  background: 'transparent'
};

const circleBtnStyle = {
  background: 'transparent',
  border: '1px solid #27272a',
  color: '#fafafa',
  padding: '8px 16px',
  borderRadius: '20px',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
