'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API_URL from '@/config';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function ReadingPage() {
  const { id, chapterNum } = useParams();
  const router = useRouter();
  const { user, fetchUser } = useAuth();
  
  const [novel, setNovel] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [price, setPrice] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [tier, setTier] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');

  // Reader Settings State
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  // Audio Reader (TTS) State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const novelRes = await fetch(`${API_URL}/novels/${id}`);
        const novelData = await novelRes.json();
        setNovel(novelData);

        try {
          const chapterRes = await axios.get(`${API_URL}/chapters/novel/${id}/chapter/${chapterNum}`, { withCredentials: true });
          const chData = chapterRes.data;
          setChapter(chData);
          setIsLocked(false);
          calculateStats(chData.content);
        } catch (error: any) {
          if (error.response?.status === 403) {
            const data = error.response.data;
            setIsLocked(true);
            setPrice(data.price || 10);
            setTier(data.tier || '');
            setChapterId(data.chapterId || '');
            setChapter({
              chapter_number: chapterNum,
              title: "Locked Chapter",
              content: "<p>This is a premium chapter. The content is hidden behind a lock. Unlock to read the full chapter.</p>"
            });
            calculateStats("<p>This is a premium chapter. The content is hidden behind a lock. Unlock to read the full chapter.</p>");
          }
        }
        window.scrollTo(0, 0);
      } catch (err) {
        console.error("Error fetching chapter:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id && chapterNum) fetchData();
  }, [id, chapterNum]);

  // Load Voices for TTS
  useEffect(() => {
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

  const calculateStats = (content: string | string[]) => {
    const text = Array.isArray(content) ? content.join(' ') : content.replace(/<[^>]+>/g, ' ');
    const words = text.trim().split(/\s+/).length;
    setWordCount(words);
    setReadTime(Math.ceil(words / 200));
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handlePlayPause = () => {
    if (!chapter) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      const textToRead = Array.isArray(chapter.content) ? chapter.content.join('. ') : stripHtml(chapter.content);
      const utterance = new SpeechSynthesisUtterance(textToRead);
      if (voices.length > 0) {
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
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleUnlock = async () => {
    if (!user) { toast.error('Sign in to unlock'); return; }
    if (user.coins < (price || 10)) { toast.error('Insufficient © coins'); router.push('/coins'); return; }
    setUnlocking(true);
    try {
      const targetId = chapterId || (await fetchChapterId());
      await axios.post(`${API_URL}/chapters/${targetId}/unlock`, {}, { withCredentials: true });
      toast.success('Unlocked with © Coins!');
      await fetchUser(); 
      const chapterRes = await axios.get(`${API_URL}/chapters/novel/${id}/chapter/${chapterNum}`, { withCredentials: true });
      setChapter(chapterRes.data);
      setIsLocked(false);
      calculateStats(chapterRes.data.content);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  const fetchChapterId = async () => {
    const listRes = await axios.get(`${API_URL}/chapters/novel/${id}`, { withCredentials: true });
    const chapterMetadata = listRes.data.find((c: any) => c.chapter_number === Number(chapterNum));
    return chapterMetadata?._id;
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Loading Story...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Merriweather, Georgia, serif', paddingBottom: '100px', transition: 'background-color 0.3s, color 0.3s' }}>
      
      {/* Schema.org Article JSON-LD for Chapter SEO */}
      {chapter && novel && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": `${novel.title} - ${chapter.title || `Chapter ${chapterNum}`}`,
              "articleSection": novel.genres?.[0] || "Web Novel",
              "author": {
                "@type": "Person",
                "name": novel.author || "SegyeNovels"
              },
              "publisher": {
                "@type": "Organization",
                "name": "SegyeNovels",
                "url": "https://segyenovels.space"
              },
              "isPartOf": {
                "@type": "Book",
                "name": novel.title,
                "url": `https://segyenovels.space/novel/${id}`
              }
            })
          }}
        />
      )}
      
      {/* Top Navbar */}
      <nav style={{ 
        position: 'sticky', top: 0, background: 'var(--bg-card)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid var(--border)`, padding: '12px 20px', zIndex: 100, 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <Link href={`/novel/${id}`} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>

        <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--accent)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%', textAlign: 'center' }}>
          {novel?.title}
        </span>

        <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex' }} aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>

        {showSettings && (
          <div style={{
            position: 'absolute', top: '60px', right: '20px', background: 'var(--bg-card)',
            border: `1px solid var(--border)`, borderRadius: '14px', padding: '24px', width: '300px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'grid', gap: '20px', zIndex: 1000
          }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>FONT SIZE</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} style={{ ...settingsBtnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>A-</button>
                <div style={{ ...settingsBtnStyle, flex: 2, background: 'transparent', color: 'var(--text-primary)', cursor: 'default', border: '1px solid var(--border)' }}>{fontSize}px</div>
                <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} style={{ ...settingsBtnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>A+</button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>AUDIO READER (TTS)</p>
              
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', marginBottom: '12px', outline: 'none', fontSize: '13px' }}
              >
                {voices.map((v, i) => (
                  <option key={i} value={i} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{v.name} ({v.lang})</option>
                ))}
                {voices.length === 0 && <option>Loading voices...</option>}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Speed</span>
                <input 
                  type="range" min="0.5" max="2" step="0.1" value={speechRate} 
                  onChange={(e) => setSpeechRate(Number(e.target.value))} 
                  style={{ flex: 1, margin: '0 12px', accentColor: 'var(--accent)' }}
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

      {/* Chapter Content Area */}
      <div style={{ maxWidth: '720px', margin: '40px auto 100px', padding: '0 24px' }}>
        
        {/* Header Block */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: '500', marginBottom: '24px', color: 'var(--text-primary)', lineHeight: 1.3 }}>{chapter.title}</h1>
          <div style={{ 
            border: '1px solid var(--border)', 
            background: 'var(--bg-secondary)',
            borderRadius: '12px', 
            padding: '16px 24px',
            fontFamily: 'Inter, system-ui, sans-serif' 
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>This Chapter</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>{wordCount.toLocaleString()} words &bull; {readTime} min read</p>
          </div>
        </header>

        {/* Text Body */}
        <article style={{ 
          fontSize: `${fontSize}px`, 
          lineHeight: '2.0', 
          color: 'var(--text-primary)',
          filter: isLocked ? 'blur(6px)' : 'none', 
          textAlign: 'left',
          userSelect: isLocked ? 'none' : 'auto'
        }}>
          {Array.isArray(chapter.content) 
            ? chapter.content.map((p: any, i: number) => <p key={i} style={{ marginBottom: '1.5em' }}>{p}</p>) 
            : <div dangerouslySetInnerHTML={{ __html: chapter.content }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }} />
          }
        </article>

        {/* Lock Overlay */}
        {isLocked && (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px 32px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)',
            borderRadius: '16px', 
            marginTop: '-150px', 
            position: 'relative', 
            zIndex: 10,
            boxShadow: '0 -20px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            <div>
              <h2 style={{ marginBottom: '8px', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>Premium Chapter Locked</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Unlock with © coins to continue reading.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
              <button onClick={handleUnlock} disabled={unlocking} style={unlockBtnStyle}>
                <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '16px' }}>©</span> Unlock for {price || 10} ©
              </button>
            </div>
          </div>
        )}

        {/* End of Chapter Footer */}
        {!isLocked && (
          <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ color: 'var(--text-muted)', letterSpacing: '8px', fontSize: '24px', marginBottom: '24px' }}>&bull; &bull; &bull;</div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>You finished this chapter</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>{wordCount.toLocaleString()} words read &bull; {readTime} min read</p>
            
            <button 
              onClick={() => router.push(`/novel/${id}/chapter/${Number(chapterNum) + 1}`)} 
              disabled={Number(chapterNum) >= novel?.total_chapters}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', opacity: Number(chapterNum) >= novel?.total_chapters ? 0.5 : 1 }}
            >
              Read next chapter &gt;
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 90,
        fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => router.push(`/novel/${id}/chapter/${Number(chapterNum) - 1}`)} 
          disabled={Number(chapterNum) <= 1} 
          style={{ background: 'transparent', border: 'none', color: Number(chapterNum) <= 1 ? 'var(--text-muted)' : 'var(--accent)', cursor: Number(chapterNum) <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', opacity: Number(chapterNum) <= 1 ? 0.4 : 1 }}
          aria-label="Previous Chapter"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>
          Chapter {chapterNum} / {novel?.total_chapters || '?'}
        </span>

        <button 
          onClick={() => router.push(`/novel/${id}/chapter/${Number(chapterNum) + 1}`)} 
          disabled={Number(chapterNum) >= novel?.total_chapters} 
          style={{ background: 'transparent', border: 'none', color: Number(chapterNum) >= novel?.total_chapters ? 'var(--text-muted)' : 'var(--accent)', cursor: Number(chapterNum) >= novel?.total_chapters ? 'default' : 'pointer', display: 'flex', alignItems: 'center', opacity: Number(chapterNum) >= novel?.total_chapters ? 0.4 : 1 }}
          aria-label="Next Chapter"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Floating Scroll Controls */}
      <div style={{ position: 'fixed', bottom: '80px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 90 }}>
        <button onClick={scrollToTop} style={{ ...scrollBtnStyle, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label="Scroll to top">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button onClick={scrollToBottom} style={{ ...scrollBtnStyle, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label="Scroll to bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

    </div>
  );
}

const settingsBtnStyle = { flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' };
const unlockBtnStyle = { background: 'linear-gradient(135deg, #b69acf, #79658d)', color: '#fff', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', boxShadow: '0 4px 15px rgba(182, 154, 207, 0.4)' };
const scrollBtnStyle = { width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
