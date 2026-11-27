'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, NovelItem, ChapterItem } from '@/utils/ssrApi';

interface ChapterReaderClientProps {
  novel: NovelItem;
  chapter: ChapterItem;
  chapterNum: number;
  novelId: string;
  isLocked: boolean;
}

export default function ChapterReaderClient({
  novel,
  chapter: initialChapter,
  chapterNum,
  novelId,
  isLocked: initialIsLocked
}: ChapterReaderClientProps) {
  const router = useRouter();
  const { user, fetchUser } = useAuth();

  const [chapter, setChapter] = useState<ChapterItem>(initialChapter);
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const [unlocking, setUnlocking] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);

  // Audio Reader (TTS) State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load Voices for TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handlePlayPause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      const textToRead = Array.isArray(chapter.content) 
        ? chapter.content.join('. ') 
        : stripHtml(typeof chapter.content === 'string' ? chapter.content : '');

      if (!textToRead.trim()) {
        toast.error('No chapter text available to read.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      if (voices.length > 0 && voices[selectedVoice]) {
        utterance.voice = voices[selectedVoice];
      }
      utterance.rate = speechRate;

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleUnlock = async () => {
    if (!user) {
      toast.error('Please sign in to unlock this chapter');
      router.push('/login');
      return;
    }

    const price = chapter.price || 10;
    if ((user.coins || 0) < price) {
      toast.error(`Insufficient coins. You have ${user.coins || 0} ©, need ${price} ©.`);
      router.push('/coins');
      return;
    }

    setUnlocking(true);
    try {
      const targetId = chapter.chapterId || chapter._id;
      if (targetId) {
        await axios.post(`${API_BASE_URL}/chapters/${targetId}/unlock`, {}, { withCredentials: true });
      } else {
        // Fallback fetch chapter id
        const listRes = await axios.get(`${API_BASE_URL}/chapters/novel/${novelId}`, { withCredentials: true });
        const match = listRes.data.find((c: any) => c.chapter_number === chapterNum);
        if (match?._id) {
          await axios.post(`${API_BASE_URL}/chapters/${match._id}/unlock`, {}, { withCredentials: true });
        }
      }

      toast.success('Chapter unlocked with © coins!');
      await fetchUser();
      // Reload page to fetch full content from SSR
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  const totalChapters = novel.total_chapters || 0;
  const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = (totalChapters === 0 || chapterNum < totalChapters) ? chapterNum + 1 : null;

  return (
    <>
      {/* Sticky Reader Controls Header */}
      <nav style={{ 
        position: 'sticky', 
        top: 0, 
        background: 'var(--bg-card)', 
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid var(--border)`, 
        padding: '12px 20px', 
        zIndex: 100, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <Link 
          href={`/novel/${novelId}`} 
          style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          aria-label="Back to Novel Overview"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Index</span>
        </Link>

        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%', textAlign: 'center' }}>
          {novel.title} &bull; Ch. {chapterNum}
        </span>

        <button 
          onClick={() => setShowSettings(!showSettings)} 
          style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', padding: '6px' }} 
          aria-label="Reader Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>

        {showSettings && (
          <div style={{
            position: 'absolute', top: '56px', right: '16px', background: 'var(--bg-card)',
            border: `1px solid var(--border)`, borderRadius: '14px', padding: '20px', width: '280px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'grid', gap: '16px', zIndex: 1000
          }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>FONT SIZE</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    const next = Math.max(14, fontSize - 2);
                    setFontSize(next);
                    const art = document.querySelector('article.chapter-content-body') as HTMLElement;
                    if (art) art.style.fontSize = `${next}px`;
                  }} 
                  style={{ ...settingsBtnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  A-
                </button>
                <div style={{ ...settingsBtnStyle, flex: 2, background: 'transparent', color: 'var(--text-primary)', cursor: 'default', border: '1px solid var(--border)' }}>
                  {fontSize}px
                </div>
                <button 
                  onClick={() => {
                    const next = Math.min(32, fontSize + 2);
                    setFontSize(next);
                    const art = document.querySelector('article.chapter-content-body') as HTMLElement;
                    if (art) art.style.fontSize = `${next}px`;
                  }} 
                  style={{ ...settingsBtnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  A+
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.05em' }}>AUDIO READER (TTS)</p>
              
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', marginBottom: '10px', outline: 'none', fontSize: '12px' }}
              >
                {voices.map((v, i) => (
                  <option key={i} value={i} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    {v.name} ({v.lang})
                  </option>
                ))}
                {voices.length === 0 && <option>Default voice</option>}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Speed</span>
                <input 
                  type="range" min="0.5" max="2" step="0.1" value={speechRate} 
                  onChange={(e) => setSpeechRate(Number(e.target.value))} 
                  style={{ flex: 1, margin: '0 10px', accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{speechRate}x</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePlayPause} style={{ ...settingsBtnStyle, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: '600' }}>
                  {isPlaying && !isPaused ? 'Pause' : 'Play'}
                </button>
                <button onClick={handleStop} disabled={!isPlaying} style={{ ...settingsBtnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', opacity: !isPlaying ? 0.5 : 1 }}>
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Lock Overlay (if chapter is locked) */}
      {isLocked && (
        <div style={{ 
          maxWidth: '540px',
          margin: '20px auto 40px',
          textAlign: 'center', 
          padding: '40px 24px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)',
          borderRadius: '16px', 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <h2 style={{ marginBottom: '6px', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Premium Chapter Locked
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Unlock Chapter {chapterNum} with © coins to continue reading instantly.
            </p>
          </div>

          <button 
            onClick={handleUnlock} 
            disabled={unlocking} 
            style={{
              background: 'var(--accent-gradient)',
              color: '#fff',
              padding: '13px 28px',
              borderRadius: '100px',
              border: 'none',
              fontWeight: '700',
              fontSize: '15px',
              cursor: unlocking ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(182, 154, 207, 0.4)'
            }}
          >
            <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '16px' }}>©</span> 
            {unlocking ? 'Unlocking Chapter...' : `Unlock for ${chapter.price || 10} © Coins`}
          </button>
        </div>
      )}

      {/* Floating Bottom Chapter Navigation Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 90,
        fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
      }}>
        {prevChapter ? (
          <Link 
            href={`/novel/${novelId}/chapter/${prevChapter}`}
            style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            <span>Prev</span>
          </Link>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            <span>Prev</span>
          </span>
        )}

        <Link 
          href={`/novel/${novelId}`}
          style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}
        >
          Ch. {chapterNum} {totalChapters ? `/ ${totalChapters}` : ''}
        </Link>

        {nextChapter ? (
          <Link 
            href={`/novel/${novelId}/chapter/${nextChapter}`}
            style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
          >
            <span>Next</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.4 }}>
            <span>Next</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </span>
        )}
      </div>

      {/* Floating Scroll Controls */}
      <div style={{ position: 'fixed', bottom: '74px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 90 }}>
        <button onClick={scrollToTop} style={scrollBtnStyle} aria-label="Scroll to top" title="Scroll to top">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button onClick={scrollToBottom} style={scrollBtnStyle} aria-label="Scroll to bottom" title="Scroll to bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    </>
  );
}

const settingsBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '13px'
};

const scrollBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};
