'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function ManageNovels() {
  const [novels, setNovels] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<string>('');

  // Novel Metadata State
  const [novelMeta, setNovelMeta] = useState<any>({ author: '', alternative_titles: '', published_year: '', publishing_status: 'ongoing' });
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  // Editor Modal State
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [rawText, setRawText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Chapter Title Edit State
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchNovels();
  }, [API_URL]);

  const fetchNovels = async () => {
    try {
      const res = await axios.get(`${API_URL}/novels`);
      setNovels(Array.isArray(res.data) ? res.data.sort((a, b) => a.title.localeCompare(b.title)) : []);
    } catch (err) {
      toast.error('Failed to load novels');
    }
  };

  const loadChapters = async (novelId: string) => {
    setSelectedNovel(novelId);
    setChapters([]);
    const n = novels.find(x => x._id === novelId);
    if (n) {
      setNovelMeta({
        author: n.author || '',
        alternative_titles: n.alternative_titles || '',
        published_year: n.published_year || '',
        publishing_status: n.publishing_status || 'ongoing'
      });
    }
    
    try {
      const res = await axios.get(`${API_URL}/chapters/novel/${novelId}`);
      const sorted = res.data.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
      setChapters(sorted);
    } catch (err) {
      toast.error('Failed to load chapters');
    }
  };

  const saveNovelMeta = async () => {
    if (!selectedNovel) return;
    setIsSavingMeta(true);
    try {
      await axios.put(`${API_URL}/admin/novel/${selectedNovel}`, novelMeta);
      toast.success('Novel metadata saved!');
      setNovels(novels.map(n => n._id === selectedNovel ? { ...n, ...novelMeta } : n));
    } catch (err) {
      toast.error('Failed to save metadata');
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleTierChange = async (chapterId: string, newTier: string) => {
    try {
      await axios.put(`${API_URL}/admin/chapter/${chapterId}`, { tier: newTier });
      toast.success('Locking rules updated!');
      setChapters(chapters.map(c => c._id === chapterId ? { ...c, tier: newTier } : c));
    } catch (err) {
      toast.error('Failed to update tier');
    }
  };

  const startEditTitle = (c: any) => {
    setEditingTitleId(c._id);
    setTempTitle(c.title);
  };

  const cancelEditTitle = () => {
    setEditingTitleId(null);
    setTempTitle('');
  };

  const saveChapterTitle = async (chapterId: string) => {
    if (!tempTitle.trim()) return toast.error('Chapter title cannot be empty');
    setIsSavingTitle(true);
    try {
      await axios.put(`${API_URL}/admin/chapter/${chapterId}`, { title: tempTitle.trim() });
      toast.success('Chapter title updated!');
      setChapters(chapters.map(c => c._id === chapterId ? { ...c, title: tempTitle.trim() } : c));
      setEditingTitleId(null);
    } catch (err) {
      toast.error('Failed to update chapter title');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const openEditor = async (chapter: any) => {
    setEditingChapter(chapter);
    setRawText('');
    try {
      const res = await axios.get(`${API_URL}/chapters/novel/${selectedNovel}/chapter/${chapter.chapter_number}`);
      setEnglishText(res.data.content || '');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setEnglishText('<p>This is a premium chapter placeholder. Edit here...</p>');
      } else {
        setEnglishText('');
      }
    }
  };

  const handleTranslate = async () => {
    if (!rawText) return toast.error('Please paste raw text first');
    setIsTranslating(true);
    try {
      const res = await axios.post(`${API_URL}/admin/translate`, { rawText });
      setEnglishText(res.data.translatedText);
      toast.success('AI Translation Complete!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const saveContent = async () => {
    if (!editingChapter || !englishText) return toast.error('Text is empty');
    setIsSaving(true);
    try {
      if (editingChapter.isNew) {
        // Create new chapter
        const res = await axios.post(`${API_URL}/admin/chapter`, { 
          novel_id: selectedNovel,
          title: editingChapter.title,
          chapter_number: editingChapter.chapter_number,
          content: englishText,
          tier: editingChapter.tier
        });
        toast.success('New chapter added successfully!');
        setChapters([...chapters, res.data.chapter]);
      } else {
        // Update existing chapter
        await axios.put(`${API_URL}/admin/chapter/${editingChapter._id}`, { 
          content: englishText,
          title: editingChapter.title 
        });
        toast.success('Chapter content and title saved successfully!');
        setChapters(chapters.map(c => c._id === editingChapter._id ? { ...c, title: editingChapter.title } : c));
      }
      setEditingChapter(null); // Close modal
    } catch (err: any) {
      toast.error('Failed to save chapter content');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>Novel & Chapter Manager</h1>
      <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '32px' }}>Adjust locking rules, metadata, and manually fix broken chapters.</p>
      
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#71717a', marginBottom: '12px' }}>SELECT NOVEL TO MANAGE</h3>
        <select 
          value={selectedNovel}
          onChange={(e) => loadChapters(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--bg-primary)', color: '#fafafa', border: '1px solid var(--border)', fontSize: '15px', outline: 'none' }}
        >
          <option value="">-- Choose a Novel --</option>
          {novels.map(n => (
            <option key={n._id} value={n._id}>{n.title}</option>
          ))}
        </select>
      </div>

      {selectedNovel && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fafafa' }}>NOVEL METADATA</h3>
            <button 
              onClick={saveNovelMeta}
              disabled={isSavingMeta}
              style={{ background: '#fafafa', color: '#09090b', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              {isSavingMeta ? 'Saving...' : 'Save Metadata'}
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Author Name</label>
              <input 
                type="text"
                value={novelMeta.author}
                onChange={e => setNovelMeta({...novelMeta, author: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Alternative Titles (comma separated)</label>
              <input 
                type="text"
                value={novelMeta.alternative_titles}
                onChange={e => setNovelMeta({...novelMeta, alternative_titles: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Published Year</label>
              <input 
                type="text"
                value={novelMeta.published_year}
                onChange={e => setNovelMeta({...novelMeta, published_year: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Status</label>
              <select 
                value={novelMeta.publishing_status}
                onChange={e => setNovelMeta({...novelMeta, publishing_status: e.target.value})}
                style={inputStyle}
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

            {selectedNovel && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#71717a', margin: 0 }}>CHAPTER LIST</h3>
                  <button 
                    onClick={() => {
                      const nextChapNum = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) + 1 : 1;
                      setEditingChapter({ isNew: true, chapter_number: nextChapNum, title: `Chapter ${nextChapNum}`, tier: 'free' });
                      setEnglishText('');
                      setRawText('');
                    }}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Add New Chapter
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 200px 120px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', color: '#71717a', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>
                  <span>CHAPTER</span>
                  <span>TITLE</span>
                  <span>LOCKING RULE</span>
                  <span style={{ textAlign: 'right' }}>ACTIONS</span>
                </div>
                
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {chapters.map(c => (
                    <div key={c._id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 200px 120px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <span style={{ color: '#a1a1aa', fontSize: '14px' }}>Ch. {c.chapter_number}</span>
                      
                      {editingTitleId === c._id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={tempTitle} 
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveChapterTitle(c._id);
                              if (e.key === 'Escape') cancelEditTitle();
                            }}
                            autoFocus
                            style={{ ...inputStyle, padding: '6px 10px', fontSize: '13px', width: '100%' }}
                          />
                          <button 
                            onClick={() => saveChapterTitle(c._id)}
                            disabled={isSavingTitle}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Save
                          </button>
                          <button 
                            onClick={cancelEditTitle}
                            style={{ background: 'transparent', border: '1px solid var(--border)', color: '#a1a1aa', padding: '6px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                          <button 
                            onClick={() => startEditTitle(c)}
                            title="Edit Chapter Title"
                            style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                          </button>
                        </div>
                      )}
                      
                      <select 
                        value={c.tier || 'free'}
                        onChange={(e) => handleTierChange(c._id, e.target.value)}
                        style={{ padding: '8px', background: 'var(--bg-primary)', color: c.tier === 'free' ? '#34d399' : '#f59e0b', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        <option value="free">🔓 Free / Unlock</option>
                        <option value="coin">🪙 Coins (Locked)</option>
                      </select>
      
                      <button 
                        onClick={() => openEditor(c)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: '#fafafa', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s', justifySelf: 'end' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        Edit Content
                      </button>
                    </div>
                  ))}
                  {chapters.length === 0 && (
                     <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No chapters exist yet. Click "+ Add New Chapter" to start!</div>
                  )}
                </div>
              </div>
            )}

      {/* Full Screen Editor Modal */}
      {editingChapter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '1200px', height: '100%', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, marginRight: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Editing: Ch. {editingChapter.chapter_number}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '500px' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa', whiteSpace: 'nowrap' }}>Title:</span>
                  <input 
                    type="text"
                    value={editingChapter.title || ''}
                    onChange={e => setEditingChapter({ ...editingChapter, title: e.target.value })}
                    placeholder="Chapter Title..."
                    style={{ ...inputStyle, padding: '6px 12px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <button onClick={() => setEditingChapter(null)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Side: AI Translator */}
              <div style={{ borderRight: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#71717a' }}>RAW TEXT (KOREAN/CHINESE)</h3>
                  <button 
                    onClick={handleTranslate}
                    disabled={isTranslating || !rawText}
                    style={{ background: '#749275', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: isTranslating ? 'wait' : 'pointer', opacity: !rawText ? 0.5 : 1 }}
                  >
                    {isTranslating ? 'Translating...' : 'Translate with AI'}
                  </button>
                </div>
                <textarea 
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste raw Korean or Chinese text here to use the AI translator..."
                  style={{ flex: 1, width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', color: '#a1a1aa', padding: '16px', fontSize: '14px', resize: 'none', outline: 'none' }}
                />
              </div>

              {/* Right Side: English Content */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#71717a' }}>ENGLISH HTML CONTENT</h3>
                  <button 
                    onClick={saveContent}
                    disabled={isSaving || !englishText}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: isSaving ? 'wait' : 'pointer', opacity: !englishText ? 0.5 : 1 }}
                  >
                    {isSaving ? 'Saving...' : 'Save Chapter'}
                  </button>
                </div>
                <textarea 
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  placeholder="<p>Chapter content goes here...</p>"
                  style={{ flex: 1, width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fafafa', padding: '16px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: '#fafafa',
  fontSize: '14px',
  outline: 'none'
};
