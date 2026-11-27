'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, NovelItem, ChapterItem } from '@/utils/ssrApi';

export default function NovelInteractiveClient({
  novel,
  chapters
}: {
  novel: NovelItem;
  chapters: ChapterItem[];
}) {
  const router = useRouter();
  const { user, fetchUser } = useAuth();

  const [activeRange, setActiveRange] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpToChapter, setJumpToChapter] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isUnlockingAll, setIsUnlockingAll] = useState(false);

  const isInLibrary = user?.library?.some((item: any) => 
    (typeof item === 'string' ? item : item?._id) === novel._id
  );

  const handleToggleLibrary = async () => {
    if (!user) {
      toast.error('Please sign in to add this novel to your library');
      router.push('/login');
      return;
    }
    setSavingLibrary(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/library/${novel._id}`, {}, { withCredentials: true });
      toast.success(res.data.message || (res.data.isAdded ? 'Added to library' : 'Removed from library'));
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update library');
    } finally {
      setSavingLibrary(false);
    }
  };

  const isPaidChapterUnlockedByUser = (ch: ChapterItem) => {
    if (!user || ch.tier === 'free' || !ch.is_locked) return false;
    if (user.role === 'admin' || user.role === 'superadmin' || user.is_vip) return true;
    const chIdStr = ch._id?.toString() || ch.chapterId;
    return (user.unlocked_chapters || []).some((unlocked: any) => {
      const uId = typeof unlocked === 'string' ? unlocked : (unlocked?._id || unlocked?.toString());
      return uId === chIdStr;
    });
  };

  const freeCount = chapters.filter(c => c.tier === 'free' || (!c.is_locked && c.chapter_number <= 50)).length;
  const lockedCount = chapters.length - freeCount;
  const lockedPaidChapters = chapters.filter(c => c.tier !== 'free' && c.chapter_number > 50);
  const remainingLockedCount = lockedPaidChapters.filter(c => !isPaidChapterUnlockedByUser(c)).length;

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
      const res = await axios.post(`${API_BASE_URL}/chapters/novel/${novel._id}/unlock-all`, {}, { withCredentials: true });
      toast.success(res.data.message || 'All chapters unlocked!');
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unlock all chapters');
    } finally {
      setIsUnlockingAll(false);
    }
  };

  const sortedChapters = [...chapters].sort((a, b) => 
    sortAsc ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number
  );

  const filteredChapters = sortedChapters.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.chapter_number.toString().includes(searchQuery)
  );

  const chaptersPerPage = 50;
  const numRanges = Math.ceil(filteredChapters.length / chaptersPerPage);
  const validActiveRange = activeRange >= numRanges && numRanges > 0 ? numRanges - 1 : activeRange;
  const displayedChapters = filteredChapters.slice(validActiveRange * chaptersPerPage, (validActiveRange + 1) * chaptersPerPage);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpToChapter, 10);
    if (isNaN(num)) return;
    const exists = chapters.find(c => c.chapter_number === num);
    if (exists) {
      router.push(`/novel/${novel._id}/chapter/${num}`);
    } else {
      toast.error(`Chapter ${num} not found.`);
    }
  };

  return (
    <div>
      {/* Action Buttons: Add to library / Unlock All */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px', margin: '0 auto 36px' }}>
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
      </div>

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

        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search chapters..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setActiveRange(0); }}
            style={inputStyle}
          />
        </div>

        <form onSubmit={handleJump} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="number" 
            placeholder="Jump to..." 
            value={jumpToChapter}
            onChange={(e) => setJumpToChapter(e.target.value)}
            style={{ ...inputStyle, width: '110px' }}
          />
          <button type="submit" style={circleBtnStyle}>Go</button>
        </form>

        <button 
          onClick={() => setSortAsc(!sortAsc)} 
          style={circleBtnStyle}
          title={sortAsc ? "Sort Descending" : "Sort Ascending"}
        >
          {sortAsc ? 'Oldest ↑' : 'Newest ↓'}
        </button>
      </div>

      {/* Chapter Range Tabs (1-50, 51-100, etc.) */}
      {numRanges > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', maxWidth: '100%' }}>
          {Array.from({ length: numRanges }).map((_, idx) => {
            const start = idx * chaptersPerPage + 1;
            const end = Math.min((idx + 1) * chaptersPerPage, filteredChapters.length);
            const isActive = validActiveRange === idx;
            return (
              <button
                key={idx}
                onClick={() => { setActiveRange(idx); document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '100px',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {start} - {end}
              </button>
            );
          })}
        </div>
      )}

      {/* Chapter List Grid: Clean, high-legibility cards with direct SSR links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {displayedChapters.map((ch) => {
          const isUnlocked = !ch.is_locked || isPaidChapterUnlockedByUser(ch);
          return (
            <Link
              key={ch.chapter_number}
              href={`/novel/${novel._id}/chapter/${ch.chapter_number}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s, transform 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  Ch. {ch.chapter_number}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.title || `Chapter ${ch.chapter_number}`}
                </span>
              </div>

              {isUnlocked ? (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                  FREE
                </span>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🔒 10 ©
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const circleBtnStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none'
};
