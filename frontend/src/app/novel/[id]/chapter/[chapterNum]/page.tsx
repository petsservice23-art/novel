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
          const chapterRes = await axios.get(`${API_URL}/chapters/novel/${id}/chapter/${chapterNum}`);
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
    if (user.coins < price) { toast.error('Insufficient coins'); router.push('/coins'); return; }
    setUnlocking(true);
    try {
      const targetId = chapterId || (await fetchChapterId());
      await axios.post(`${API_URL}/chapters/${targetId}/unlock`);
      toast.success('Unlocked with Coins!');
      await fetchUser(); 
      const chapterRes = await axios.get(`${API_URL}/chapters/novel/${id}/chapter/${chapterNum}`);
      setChapter(chapterRes.data);
      setIsLocked(false);
      calculateStats(chapterRes.data.content);
    } catch (err) { toast.error('Unlock failed'); } finally { setUnlocking(false); }
  };

  const handleTicketUnlock = async () => {
    if (!user) { toast.error('Sign in to unlock'); return; }
    if (!user.unlock_tickets || user.unlock_tickets < 1) { toast.error('No unlock tickets available'); return; }
    setUnlocking(true);
    try {
      const targetId = chapterId || (await fetchChapterId());
      await axios.post(`${API_URL}/chapters/${targetId}/ticket-unlock`);
      toast.success('Unlocked with Ticket!');
      await fetchUser(); 
      const chapterRes = await axios.get(`${API_URL}/chapters/novel/${id}/chapter/${chapterNum}`);
      setChapter(chapterRes.data);
      setIsLocked(false);
      calculateStats(chapterRes.data.content);
    } catch (err) { toast.error('Ticket unlock failed'); } finally { setUnlocking(false); }
  };

  const handleAdUnlock = async () => {
    if (!user) { toast.error('Sign in to unlock'); return; }
    setUnlocking(true);
    try {
      const targetId = chapterId || (await fetchChapterId());
      await axios.post(`${API_URL}/retention/ad-unlock/${targetId}`);
      toast.success('Unlocked via Ad watch!');
      await fetchUser(); 
      const chapterRes = await axios.get(`${API_URL}/chapters/novel/${id}/chapter/${chapterNum}`);
      setChapter(chapterRes.data);
      setIsLocked(false);
      calculateStats(chapterRes.data.content);
    } catch (err) { toast.error('Ad unlock failed'); } finally { setUnlocking(false); }
  };

  const fetchChapterId = async () => {
    const listRes = await axios.get(`${API_URL}/chapters/novel/${id}`);
    const chapterMetadata = listRes.data.find((c: any) => c.chapter_number === Number(chapterNum));
    return chapterMetadata?._id;
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#a1a1aa' }}>Loading Story...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#121212', color: '#d4d4d8', fontFamily: 'Merriweather, Georgia, serif', paddingBottom: '100px', transition: 'all 0.3s' }}>
      
      {/* Top Navbar */}
      <nav style={{ 
        position: 'sticky', top: 0, background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid #27272a`, padding: '12px 20px', zIndex: 100, 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <Link href={`/novel/${id}`} style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>

        <span style={{ fontWeight: '500', fontSize: '15px', color: '#749275', letterSpacing: '-0.01em' }}>
          {novel?.title}
        </span>

        <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>

        {showSettings && (
          <div style={{
            position: 'absolute', top: '60px', right: '20px', background: '#18181b',
            border: `1px solid #27272a`, borderRadius: '12px', padding: '24px', width: '300px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'grid', gap: '24px', zIndex: 1000
          }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#71717a', marginBottom: '8px' }}>FONT SIZE</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} style={settingsBtnStyle}>A-</button>
                <div style={{ ...settingsBtnStyle, flex: 2, background: 'transparent', cursor: 'default' }}>{fontSize}px</div>
                <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} style={settingsBtnStyle}>A+</button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #27272a', paddingTop: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#71717a', marginBottom: '12px' }}>AUDIO READER (BETA)</p>
              
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #27272a', color: '#fafafa', borderRadius: '6px', marginBottom: '12px', outline: 'none' }}
              >
                {voices.map((v, i) => (
                  <option key={i} value={i} style={{ background: '#18181b' }}>{v.name} ({v.lang})</option>
                ))}
                {voices.length === 0 && <option>Loading voices...</option>}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Speed</span>
                <input 
                  type="range" min="0.5" max="2" step="0.1" value={speechRate} 
                  onChange={(e) => setSpeechRate(Number(e.target.value))} 
                  style={{ flex: 1, margin: '0 12px' }}
                />
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{speechRate}x</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePlayPause} style={{ ...settingsBtnStyle, background: '#749275', color: '#fff', border: 'none' }}>
                  {isPlaying && !isPaused ? 'Pause' : 'Play'}
                </button>
                <button onClick={handleStop} disabled={!isPlaying} style={{ ...settingsBtnStyle, opacity: !isPlaying ? 0.5 : 1 }}>
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Chapter Content Area */}
      <div style={{ maxWidth: '720px', margin: '60px auto 100px', padding: '0 24px' }}>
        
        {/* Header Block */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '400', marginBottom: '32px', color: '#fafafa' }}>{chapter.title}</h1>
          <div style={{ 
            border: '1px solid #27272a', 
            borderRadius: '12px', 
            padding: '24px',
            fontFamily: 'Inter, system-ui, sans-serif' 
          }}>
            <p style={{ color: '#71717a', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>This Chapter</p>
            <p style={{ color: '#a1a1aa', fontSize: '14px' }}>{wordCount.toLocaleString()} words &bull; {readTime} min read</p>
          </div>
        </header>

        {/* Text Body */}
        <article style={{ 
          fontSize: `${fontSize}px`, 
          lineHeight: '2.0', 
          color: '#e4e4e7',
          filter: isLocked ? 'blur(6px)' : 'none', 
          textAlign: 'left',
          userSelect: isLocked ? 'none' : 'auto'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#fafafa' }}>{chapter.title}</h2>
          
          {Array.isArray(chapter.content) 
            ? chapter.content.map((p: any, i: number) => <p key={i} style={{ marginBottom: '1.5em' }}>{p}</p>) 
            : <div dangerouslySetInnerHTML={{ __html: chapter.content }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }} />
          }
        </article>

        {/* Lock Overlay */}
        {isLocked && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 40px', 
            background: '#18181b', 
            border: '1px solid #27272a',
            borderRadius: '16px', 
            marginTop: '-150px', 
            position: 'relative', 
            zIndex: 10,
            boxShadow: '0 -20px 40px rgba(18, 18, 18, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            <div>
              <h2 style={{ marginBottom: '12px', fontSize: '24px', fontWeight: '600', color: '#fafafa' }}>Premium Chapter Locked</h2>
              <p style={{ color: '#a1a1aa', fontSize: '15px' }}>Choose an option below to unlock it instantly and continue reading.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
              <button onClick={handleUnlock} disabled={unlocking} style={unlockBtnStyle}>
                <span>🪙</span> Unlock for {price} Coins
              </button>

              <button onClick={handleTicketUnlock} disabled={unlocking} style={{ ...unlockBtnStyle, background: 'transparent', border: '1px solid #27272a', color: '#fafafa' }}>
                <span>🎟️</span> Use Ticket ({user?.unlock_tickets || 0})
              </button>

              {tier === 'ad' && (
                <button onClick={handleAdUnlock} disabled={unlocking} style={{ ...unlockBtnStyle, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                  <span>📺</span> Watch Ad to Unlock
                </button>
              )}
            </div>
          </div>
        )}

        {/* End of Chapter Footer */}
        {!isLocked && (
          <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ color: '#71717a', letterSpacing: '8px', fontSize: '24px', marginBottom: '32px' }}>&bull; &bull; &bull;</div>
            <h3 style={{ color: '#fafafa', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>You finished this chapter</h3>
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '32px' }}>{wordCount.toLocaleString()} words read &bull; {readTime} min read</p>
            
            <button 
              onClick={() => router.push(`/novel/${id}/chapter/${Number(chapterNum) + 1}`)} 
              disabled={Number(chapterNum) >= novel?.total_chapters}
              style={{ background: '#749275', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}
            >
              Read next chapter &gt;
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#121212', borderTop: '1px solid #27272a',
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 90,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <button 
          onClick={() => router.push(`/novel/${id}/chapter/${Number(chapterNum) - 1}`)} 
          disabled={Number(chapterNum) <= 1} 
          style={{ background: 'transparent', border: 'none', color: Number(chapterNum) <= 1 ? '#3f3f46' : '#749275', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <span style={{ color: '#fafafa', fontSize: '15px', fontWeight: '600' }}>
          {chapterNum} / {novel?.total_chapters || '?'}
        </span>

        <button 
          onClick={() => router.push(`/novel/${id}/chapter/${Number(chapterNum) + 1}`)} 
          disabled={Number(chapterNum) >= novel?.total_chapters} 
          style={{ background: 'transparent', border: 'none', color: Number(chapterNum) >= novel?.total_chapters ? '#3f3f46' : '#749275', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Floating Scroll Controls */}
      <div style={{ position: 'fixed', bottom: '80px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 90 }}>
        <button onClick={scrollToTop} style={scrollBtnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button onClick={scrollToBottom} style={scrollBtnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

    </div>
  );
}

const settingsBtnStyle = { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #27272a', background: 'transparent', color: '#fafafa', cursor: 'pointer', fontSize: '14px' };
const unlockBtnStyle = { background: '#f97316', color: '#fff', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' };
const scrollBtnStyle = { width: '40px', height: '40px', borderRadius: '50%', background: '#18181b', border: '1px solid #27272a', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' };
