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
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isUnlockingAll, setIsUnlockingAll] = useState(false);

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
          document.title = `${novelData.title} - Read Online All Chapters | SegyeNovels`;
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      Loading novel details...
    </div>
  );

  if (!novel) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '16px' }}>
      <h2>Novel Not Found</h2>
      <Link href="/browse" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>← Return to Library</Link>
    </div>
  );

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

  const isPaidChapterUnlockedByUser = (ch: any) => {
    if (!user || ch.tier === 'free') return false;
    if (user.role === 'admin' || user.role === 'superadmin' || user.is_vip) return true;
    const chIdStr = ch._id?.toString();
    return (user.unlocked_chapters || []).some((unlocked: any) => {
      const uId = typeof unlocked === 'string' ? unlocked : (unlocked?._id || unlocked?.toString());
      return uId === chIdStr;
    });
  };

  const freeCount = chapters.filter(c => c.tier === 'free').length;
  const lockedCount = chapters.length - freeCount;
  const userUnlockedPaidCount = chapters.filter(c => c.tier !== 'free' && isPaidChapterUnlockedByUser(c)).length;
  const lockedPaidChapters = chapters.filter(c => c.tier !== 'free');
  const remainingLockedCount = lockedPaidChapters.filter(c => !isPaidChapterUnlockedByUser(c)).length;
  const isCompleted = (novel.publishing_status || 'completed').toLowerCase() === 'completed';

  const handleUnlockAll = async () => {
    if (!user) {
      toast.error('Please sign in to unlock chapters');
      router.push('/login');
      return;
    }
    if (remainingLockedCount === 0) {
      toast.success('All chapters for this novel are already unlocked!');
      return;
    }
    const neededCoins = remainingLockedCount * 10;
    if ((user.coins || 0) < neededCoins) {
      toast.error(`You need ${neededCoins} coins to unlock all remaining chapters. You have ${user.coins || 0} coins.`);
      setTimeout(() => router.push('/coins'), 1500);
      return;
    }

    if (!window.confirm(`Unlock all ${remainingLockedCount} remaining chapters for ${neededCoins} coins?`)) {
      return;
    }

    setIsUnlockingAll(true);
    try {
      const res = await axios.post(`${API_URL}/chapters/novel/${id}/unlock-all`, {}, { withCredentials: true });
      toast.success(res.data.message || 'Unlocked all chapters!');
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unlock chapters');
    } finally {
      setIsUnlockingAll(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      transition: 'background-color 0.2s, color 0.2s' 
    }}>
      
      {/* Schema.org Book JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "name": novel.title,
            "author": {
              "@type": "Person",
              "name": novel.author || "SegyeNovels"
            },
            "description": novel.description,
            "genre": novel.genres,
            "datePublished": novel.published_year || "2024",
            "numberOfPages": novel.total_chapters,
            "publisher": {
              "@type": "Organization",
              "name": "SegyeNovels"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": novel.rating || 4.7,
              "ratingCount": novel.ratings_count || 150
            }
          })
        }}
      />
      
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 8px' }}>&gt;</span>
        <Link href="/browse" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Novels</Link>
        <span style={{ margin: '0 8px' }}>&gt;</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{novel.title}</span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Cover Image */}
        <div style={{ 
          width: '240px', 
          aspectRatio: '2/3', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          marginBottom: '28px', 
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)'
        }}>
          <img 
            src={novel.cover_image} 
            alt={novel.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/400/600`; }}
          />
        </div>

        {/* Title */}
        <h1 style={{ 
          fontSize: 'clamp(28px, 4vw, 38px)', 
          fontWeight: '800', 
          marginBottom: '8px', 
          textAlign: 'center', 
          letterSpacing: '-0.02em', 
          color: 'var(--text-primary)' 
        }}>
          {novel.title}
        </h1>
        
        {/* Alternate / Original Title Area */}
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {novel.alternative_titles && <span>Also known as: <i>{novel.alternative_titles}</i></span>}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={badgeStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {novel.published_year || '2021'}
          </div>
          <div style={{ 
            ...badgeStyle, 
            color: isCompleted ? 'var(--green)' : '#3b82f6', 
            background: isCompleted ? 'rgba(76, 175, 125, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            border: isCompleted ? '1px solid rgba(76, 175, 125, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: '700'
          }}>
            {isCompleted ? 'Completed' : 'Ongoing'}
          </div>
          <div style={badgeStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            {novel.total_chapters} chapters
          </div>
          <div style={{ ...badgeStyle, color: 'var(--green)' }}>
            {freeCount} free chapters
          </div>
          {userUnlockedPaidCount > 0 && (
            <div style={{ ...badgeStyle, color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
              ✓ {userUnlockedPaidCount} unlocked with ©
            </div>
          )}
        </div>

        {/* Short Meta Text */}
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', lineHeight: '1.65', maxWidth: '680px', marginBottom: '28px' }}>
          <i>{novel.title}</i> is written by <b>{novel.author || 'Korean Author'}</b> and was first published in {novel.published_year || '2021'}. It is a {novel.genres?.join(', ') || 'Web'} novel with {novel.total_chapters} chapters available on SegyeNovels.
        </p>

        {/* Genres */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '36px' }}>
          {novel.genres?.map((g: string) => (
            <span key={g} style={tagStyle}>{g}</span>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px', marginBottom: '48px' }}>
          <Link href={`/novel/${id}/chapter/1`} style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '100px', 
              border: 'none', 
              background: 'var(--accent-gradient)', 
              color: '#fff', 
              fontSize: '15px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.92';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'none';
            }}
            >
              Start Reading (Chapter 1)
            </button>
          </Link>

          <button 
            onClick={handleToggleLibrary}
            disabled={savingLibrary}
            style={{ 
              width: '100%', 
              padding: '13px', 
              borderRadius: '100px', 
              border: '1px solid var(--border)', 
              background: isInLibrary ? 'var(--accent-soft)' : 'var(--bg-card)', 
              color: isInLibrary ? 'var(--accent)' : 'var(--text-primary)', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: savingLibrary ? 'wait' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              transition: 'all 0.15s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isInLibrary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {savingLibrary ? 'Updating...' : isInLibrary ? 'In Library ✓' : 'Add to Library'}
          </button>

          {/* Unlock All Chapters Button */}
          {remainingLockedCount > 0 ? (
            <button 
              onClick={handleUnlockAll}
              disabled={isUnlockingAll}
              style={{ 
                width: '100%', 
                padding: '13px', 
                borderRadius: '100px', 
                border: '1px solid rgba(234, 179, 8, 0.45)', 
                background: 'rgba(234, 179, 8, 0.12)', 
                color: '#eab308', 
                fontSize: '14px', 
                fontWeight: '700', 
                cursor: isUnlockingAll ? 'wait' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(234, 179, 8, 0.22)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(234, 179, 8, 0.12)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
              {isUnlockingAll 
                ? 'Unlocking Chapters...' 
                : `Unlock All (${remainingLockedCount} chapters · ${remainingLockedCount * 10} ©)`}
            </button>
          ) : lockedPaidChapters.length > 0 ? (
            <div style={{
              width: '100%',
              padding: '12px',
              borderRadius: '100px',
              border: '1px solid rgba(76, 175, 125, 0.35)',
              background: 'rgba(76, 175, 125, 0.12)',
              color: 'var(--green)',
              fontSize: '13px',
              fontWeight: '700',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              ✓ All Chapters Unlocked
            </div>
          ) : null}

          <button 
            onClick={() => document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ 
              width: '100%', 
              padding: '13px', 
              borderRadius: '100px', 
              border: '1px solid var(--border)', 
              background: 'transparent', 
              color: 'var(--text-secondary)', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            All Chapters ({chapters.length})
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '36px' }}></div>

        {/* Synopsis Section with Read more / Show less */}
        <div style={{ width: '100%', textAlign: 'left', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>Synopsis</h2>
          <div style={{ position: 'relative' }}>
            <p style={{ 
              color: 'var(--text-secondary)', 
              lineHeight: '1.8', 
              fontSize: '15px', 
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {isDescExpanded || (novel.description || '').length <= 320 
                ? novel.description 
                : `${(novel.description || '').slice(0, 320)}...`}
            </p>
            {(novel.description || '').length > 320 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '8px 0',
                  marginTop: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isDescExpanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {novel.tags && novel.tags.length > 0 && (
          <div style={{ width: '100%', textAlign: 'left', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Tags</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {novel.tags.map((t: string) => (
                <span key={t} style={tagStyle}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Chapters Header Section */}
        <div id="chapters-section" style={{ width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Chapters <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>({chapters.length})</span>
            </h2>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {(lockedCount * 10).toLocaleString()} <span style={{ fontWeight: '800' }}>©</span>
          </span>
        </div>

        {/* Chapter Search / Filter Row */}
        <div style={{ width: '100%', display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
          
          <div style={{ flex: 1, position: 'relative', minWidth: '180px' }}>
            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Search chapter title or #..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveRange(0); }}
              style={{ width: '100%', padding: '9px 16px 9px 38px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '100px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? "Sort: Ascending" : "Sort: Descending"}
              style={{ 
                ...circleBtnStyle, 
                padding: '0 12px',
                background: !sortAsc ? 'var(--accent-soft)' : 'var(--bg-card)',
                borderColor: !sortAsc ? 'var(--accent)' : 'var(--border)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
            </button>
            
            <input 
              type="number" 
              placeholder="Go #" 
              value={jumpToChapter}
              onChange={(e) => setJumpToChapter(e.target.value)}
              style={{ width: '70px', padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '100px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', textAlign: 'center' }}
            />
            <button 
              onClick={() => { if(jumpToChapter) window.location.href = `/novel/${id}/chapter/${jumpToChapter}`; }}
              style={circleBtnStyle}
            >
              Go
            </button>
          </div>
        </div>

        {/* Chapters List */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          border: '1px solid var(--border)', 
          borderRadius: '14px', 
          overflow: 'hidden',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {displayedChapters.map((chapter: any, index: number) => (
            <Link key={chapter._id} href={`/novel/${id}/chapter/${chapter.chapter_number}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '14px 18px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: index !== displayedChapters.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'transparent',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '32px', textAlign: 'right', flexShrink: 0 }}>{chapter.chapter_number}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chapter.title}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTimeAgo(chapter.createdAt || novel.updatedAt)}</span>
                  {chapter.tier === 'free' ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: 'var(--green)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      FREE
                    </span>
                  ) : isPaidChapterUnlockedByUser(chapter) ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: 'var(--accent)',
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
                      color: 'var(--gold)',
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
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No chapters found matching your search.
            </div>
          )}
        </div>

        {/* Pagination Block */}
        {numRanges > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => setActiveRange(Math.max(0, activeRange - 1))}
              disabled={activeRange === 0}
              style={{ background: 'transparent', border: 'none', color: activeRange === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', cursor: activeRange === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              Previous
            </button>

            {Array.from({ length: numRanges }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveRange(i)}
                style={{
                  background: activeRange === i ? 'var(--accent)' : 'var(--bg-card)',
                  color: activeRange === i ? '#fff' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setActiveRange(Math.min(numRanges - 1, activeRange + 1))}
              disabled={activeRange === numRanges - 1}
              style={{ background: 'transparent', border: 'none', color: activeRange === numRanges - 1 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', cursor: activeRange === numRanges - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}
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

const badgeStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  padding: '6px 12px',
  borderRadius: '100px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  boxShadow: 'var(--shadow-sm)'
};

const tagStyle = {
  border: '1px solid var(--border)',
  padding: '6px 14px',
  borderRadius: '100px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  background: 'var(--bg-card)'
};

const circleBtnStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  padding: '8px 16px',
  borderRadius: '100px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
