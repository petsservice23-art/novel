'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ManageNovels() {
  const [novels, setNovels] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<string>('');
  const [novelSearch, setNovelSearch] = useState<string>('');

  // Novel Metadata State
  const [novelMeta, setNovelMeta] = useState<any>({
    title: '',
    author: '',
    alternative_titles: '',
    published_year: '',
    publishing_status: 'ongoing',
    description: '',
    is_hidden: false
  });
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  // Deletion Modal State
  const [novelToDelete, setNovelToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Bulk Locking State
  const [bulkFreeUntil, setBulkFreeUntil] = useState<number>(50);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchNovels();
  }, [API_URL]);

  const fetchNovels = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/novels`);
      const data = Array.isArray(res.data) ? res.data : [];
      setNovels(data.sort((a, b) => a.title.localeCompare(b.title)));
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
        title: n.title || '',
        author: n.author || '',
        alternative_titles: n.alternative_titles || '',
        published_year: n.published_year || '',
        publishing_status: n.publishing_status || 'ongoing',
        description: n.description || '',
        is_hidden: !!n.is_hidden
      });
    }
    
    try {
      const res = await axios.get(`${API_URL}/chapters/novel/${novelId}`);
      const sorted = res.data.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
      setChapters(sorted);
      const freeCount = sorted.filter((c: any) => c.tier === 'free').length;
      setBulkFreeUntil(freeCount || 50);
    } catch (err) {
      toast.error('Failed to load chapters');
    }
  };

  // 1. Toggle Visibility (Hide / Unhide)
  const handleToggleVisibility = async (novelId: string) => {
    try {
      const res = await axios.put(`${API_URL}/admin/novel/${novelId}/toggle-visibility`);
      const isHidden = res.data.is_hidden;

      toast.success(res.data.message || (isHidden ? 'Novel is now hidden' : 'Novel is now visible'));

      // Update state
      setNovels(novels.map(n => n._id === novelId ? { ...n, is_hidden: isHidden, status: res.data.status } : n));
      if (selectedNovel === novelId) {
        setNovelMeta((prev: any) => ({ ...prev, is_hidden: isHidden }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update visibility');
    }
  };

  // 2. Delete Whole Novel
  const handleConfirmDelete = async () => {
    if (!novelToDelete) return;
    setIsDeleting(true);

    try {
      await axios.delete(`${API_URL}/admin/novel/${novelToDelete._id}`);
      toast.success(`"${novelToDelete.title}" and all its chapters were deleted!`);

      setNovels(novels.filter(n => n._id !== novelToDelete._id));
      if (selectedNovel === novelToDelete._id) {
        setSelectedNovel('');
        setChapters([]);
      }
      setNovelToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete novel');
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. Save Novel Metadata
  const saveNovelMeta = async () => {
    if (!selectedNovel) return;
    setIsSavingMeta(true);
    try {
      await axios.put(`${API_URL}/admin/novel/${selectedNovel}`, novelMeta);
      toast.success('Novel metadata saved successfully!');
      setNovels(novels.map(n => n._id === selectedNovel ? { ...n, ...novelMeta } : n));
    } catch (err) {
      toast.error('Failed to save metadata');
    } finally {
      setIsSavingMeta(false);
    }
  };

  // 4. Bulk Lock Rules
  const handleBulkLock = async () => {
    if (!selectedNovel) return;
    if (bulkFreeUntil < 0) return toast.error('Chapter number must be 0 or higher');
    setIsApplyingBulk(true);
    try {
      const res = await axios.put(`${API_URL}/admin/novel/${selectedNovel}/bulk-lock`, { freeUntil: bulkFreeUntil });
      toast.success(res.data.message || 'Bulk locking rules applied!');
      setChapters(chapters.map(c => ({
        ...c,
        tier: c.chapter_number <= bulkFreeUntil ? 'free' : 'coin'
      })));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply bulk locking');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // 5. Individual Tier Change
  const handleTierChange = async (chapterId: string, newTier: string) => {
    try {
      await axios.put(`${API_URL}/admin/chapter/${chapterId}`, { tier: newTier });
      toast.success('Locking rules updated!');
      setChapters(chapters.map(c => c._id === chapterId ? { ...c, tier: newTier } : c));
    } catch (err) {
      toast.error('Failed to update tier');
    }
  };

  // 6. Chapter Title Edit
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

  // 7. Chapter Content Editor
  const openEditor = async (chapter: any) => {
    setEditingChapter(chapter);
    setRawText('');
    try {
      const res = await axios.get(`${API_URL}/chapters/novel/${selectedNovel}/chapter/${chapter.chapter_number}`);
      setEnglishText(Array.isArray(res.data.content) ? res.data.content.join('\n\n') : (res.data.content || ''));
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
        await axios.put(`${API_URL}/admin/chapter/${editingChapter._id}`, { 
          content: englishText,
          title: editingChapter.title 
        });
        toast.success('Chapter content and title saved successfully!');
        setChapters(chapters.map(c => c._id === editingChapter._id ? { ...c, title: editingChapter.title } : c));
      }
      setEditingChapter(null);
    } catch (err: any) {
      toast.error('Failed to save chapter content');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredNovels = novels.filter(n =>
    n.title.toLowerCase().includes(novelSearch.toLowerCase()) ||
    (n.alternative_titles && n.alternative_titles.toLowerCase().includes(novelSearch.toLowerCase())) ||
    (n.author && n.author.toLowerCase().includes(novelSearch.toLowerCase()))
  );

  const currentNovel = novels.find(n => n._id === selectedNovel);

  // Strictly black styling
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#000000', marginBottom: '6px', fontWeight: '800' };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#000000',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#000000', paddingBottom: '60px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#000000', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Manage Novels & Chapters
        </h1>
        <p style={{ color: '#1f2937', fontSize: '15px' }}>
          Inspect novels, hide/unhide titles from public view, edit chapter locking rules, or delete novels completely.
        </p>
      </div>

      {/* QUICK NOVEL DIRECTORY TABLE & SEARCH */}
      <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#000000', margin: 0 }}>
            ALL NOVELS ({filteredNovels.length} of {novels.length})
          </h3>
          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
            Click "Edit & Chapters" to configure or use quick actions
          </span>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <input
            type="text"
            placeholder="🔍 Search novel by title, Korean name, or author..."
            value={novelSearch}
            onChange={(e) => setNovelSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingRight: '36px',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#000000',
              border: '1.5px solid #94a3b8',
              fontSize: '14px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {novelSearch && (
            <button
              onClick={() => setNovelSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Novels Table (Quick Actions) */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#000000' }}>
                <th style={{ padding: '12px 14px', fontWeight: '800' }}>NOVEL</th>
                <th style={{ padding: '12px 14px', fontWeight: '800' }}>AUTHOR</th>
                <th style={{ padding: '12px 14px', fontWeight: '800' }}>CHAPTERS</th>
                <th style={{ padding: '12px 14px', fontWeight: '800' }}>VISIBILITY</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredNovels.slice(0, 50).map((n) => {
                const isSelected = n._id === selectedNovel;
                const isHidden = !!n.is_hidden || n.status === 'hidden';

                return (
                  <tr
                    key={n._id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#000000' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={n.cover_image}
                          alt={n.title}
                          style={{ width: '28px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${n._id}/100/150`; }}
                        />
                        <div>
                          <div style={{ color: '#000000', fontWeight: '800' }}>{n.title}</div>
                          {n.alternative_titles && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{n.alternative_titles.slice(0, 30)}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px', color: '#1e293b' }}>
                      {n.author || 'Korean Author'}
                    </td>

                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#000000' }}>
                      {n.total_chapters || 0}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isHidden ? '#fef3c7' : '#dcfce7',
                        color: isHidden ? '#92400e' : '#166534',
                        border: isHidden ? '1px solid #fde68a' : '1px solid #bbf7d0'
                      }}>
                        {isHidden ? '👁️‍🗨️ Hidden' : '🟢 Visible'}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => loadChapters(n._id)}
                          style={{
                            background: isSelected ? '#10b981' : '#6366f1',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? '✓ Selected' : '✏️ Edit'}
                        </button>

                        <button
                          onClick={() => handleToggleVisibility(n._id)}
                          title={isHidden ? 'Make visible to public' : 'Hide from public catalog'}
                          style={{
                            background: isHidden ? '#dcfce7' : '#fef3c7',
                            color: isHidden ? '#166534' : '#92400e',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {isHidden ? '👁️ Unhide' : '🙈 Hide'}
                        </button>

                        <button
                          onClick={() => setNovelToDelete(n)}
                          title="Delete entire novel and its chapters"
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fca5a5',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTED NOVEL ACTIVE MANAGEMENT PANEL */}
      {selectedNovel && currentNovel && (
        <div style={{ marginBottom: '32px' }}>
          
          {/* Header Bar of Selected Novel */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #6366f1',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 6px 18px rgba(99, 102, 241, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={currentNovel.cover_image}
                alt={currentNovel.title}
                style={{ width: '56px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
              />
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' }}>
                  Currently Editing
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#000000', margin: '2px 0 4px' }}>
                  {currentNovel.title}
                </h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: '#334155' }}>
                  <span>By <strong>{currentNovel.author || 'Korean Author'}</strong></span>
                  <span>•</span>
                  <span><strong>{chapters.length}</strong> chapters</span>
                  <span>•</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    background: currentNovel.is_hidden ? '#fef3c7' : '#dcfce7',
                    color: currentNovel.is_hidden ? '#92400e' : '#166534'
                  }}>
                    {currentNovel.is_hidden ? '👁️‍🗨️ Hidden' : '🟢 Live on Site'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Novel Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleToggleVisibility(selectedNovel)}
                style={{
                  background: currentNovel.is_hidden ? '#dcfce7' : '#fef3c7',
                  color: currentNovel.is_hidden ? '#166534' : '#92400e',
                  border: currentNovel.is_hidden ? '1.5px solid #86efac' : '1.5px solid #fde68a',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {currentNovel.is_hidden ? '👁️ Unhide Novel (Show on Site)' : '🙈 Hide Novel (Remove from Site)'}
              </button>

              <button
                onClick={() => setNovelToDelete(currentNovel)}
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1.5px solid #f87171',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete Whole Novel
              </button>
            </div>
          </div>

          {/* NOVEL METADATA FORM */}
          <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#000000', margin: 0 }}>
                NOVEL METADATA
              </h3>
              <button
                onClick={saveNovelMeta}
                disabled={isSavingMeta}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: isSavingMeta ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isSavingMeta ? 'Saving...' : '💾 Save Metadata'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Novel Title</label>
                <input
                  type="text"
                  value={novelMeta.title}
                  onChange={e => setNovelMeta({ ...novelMeta, title: e.target.value })}
                  style={{ ...inputStyle, fontWeight: '700', fontSize: '15px' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Author Name</label>
                <input
                  type="text"
                  value={novelMeta.author}
                  onChange={e => setNovelMeta({ ...novelMeta, author: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Alternative Titles (comma separated)</label>
                <input
                  type="text"
                  value={novelMeta.alternative_titles}
                  onChange={e => setNovelMeta({ ...novelMeta, alternative_titles: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Published Year</label>
                <input
                  type="text"
                  value={novelMeta.published_year}
                  onChange={e => setNovelMeta({ ...novelMeta, published_year: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Publishing Status</label>
                <select
                  value={novelMeta.publishing_status}
                  onChange={e => setNovelMeta({ ...novelMeta, publishing_status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>Synopsis / Description</label>
              <textarea
                rows={5}
                value={novelMeta.description || ''}
                onChange={e => setNovelMeta({ ...novelMeta, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>
          </div>

          {/* BULK CHAPTER LOCKING RULES */}
          <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                  ⚡ BULK CHAPTER LOCKING RULES
                </h3>
                <p style={{ color: '#334155', fontSize: '13px', margin: 0 }}>
                  Specify how many chapters are free. All chapters after that threshold are coin-locked (10 Coins).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#047857', background: '#dcfce7', padding: '6px 12px', borderRadius: '6px' }}>
                  🔓 {chapters.filter(c => c.tier === 'free').length} Free
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: '6px' }}>
                  🟡 {chapters.filter(c => c.tier !== 'free').length} Locked (10 Coins)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '14px', color: '#000000' }}>
                Keep chapters <strong>1</strong> to
              </span>
              <input
                type="number"
                min="0"
                max={chapters.length || 1000}
                value={bulkFreeUntil}
                onChange={(e) => setBulkFreeUntil(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ ...inputStyle, width: '90px', textAlign: 'center', fontWeight: '800', fontSize: '15px' }}
              />
              <span style={{ fontSize: '14px', color: '#000000' }}>
                <strong>FREE</strong>, and lock all chapters from <strong>{bulkFreeUntil + 1}</strong> onwards with <strong>10 Coins</strong>.
              </span>
              <button
                onClick={handleBulkLock}
                disabled={isApplyingBulk}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: isApplyingBulk ? 'not-allowed' : 'pointer',
                  marginLeft: 'auto'
                }}
              >
                {isApplyingBulk ? 'Applying Rule...' : 'Apply Locking Rule'}
              </button>
            </div>
          </div>

          {/* CHAPTER LIST */}
          <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#000000', margin: 0 }}>
                CHAPTER LIST ({chapters.length})
              </h3>
              <button
                onClick={() => {
                  const nextChapNum = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) + 1 : 1;
                  setEditingChapter({ isNew: true, chapter_number: nextChapNum, title: `Chapter ${nextChapNum}`, tier: 'free' });
                  setEnglishText('');
                  setRawText('');
                }}
                style={{ background: '#6366f1', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
              >
                + Add New Chapter
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 200px 120px', gap: '16px', padding: '14px 24px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', color: '#000000', fontSize: '12px', fontWeight: '800' }}>
              <span>CHAPTER</span>
              <span>TITLE</span>
              <span>TIER</span>
              <span style={{ textAlign: 'right' }}>ACTIONS</span>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {chapters.map(c => (
                <div
                  key={c._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 200px 120px',
                    gap: '16px',
                    padding: '14px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    alignItems: 'center',
                    background: '#ffffff'
                  }}
                >
                  <span style={{ color: '#334155', fontWeight: '700', fontSize: '14px' }}>
                    Ch. {c.chapter_number}
                  </span>

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
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '13px' }}
                      />
                      <button
                        onClick={() => saveChapterTitle(c._id)}
                        disabled={isSavingTitle}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditTitle}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#000000', padding: '6px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.title}
                      </span>
                      <button
                        onClick={() => startEditTitle(c)}
                        title="Edit Chapter Title"
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px 4px' }}
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  <div>
                    <select
                      value={c.tier}
                      onChange={(e) => handleTierChange(c._id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: c.tier === 'free' ? '#ecfdf5' : '#fef3c7',
                        color: c.tier === 'free' ? '#065f46' : '#92400e',
                        border: c.tier === 'free' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                        fontWeight: '800',
                        fontSize: '12px'
                      }}
                    >
                      <option value="free">Free Chapter</option>
                      <option value="coin">Coin Locked (10 ©)</option>
                    </select>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => openEditor(c)}
                      style={{
                        background: '#f1f5f9',
                        color: '#000000',
                        border: '1.5px solid #cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Text
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {novelToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '2px solid #ef4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#991b1b', margin: 0 }}>
                  Permanently Delete Novel?
                </h3>
                <p style={{ color: '#475569', fontSize: '13px', margin: '2px 0 0' }}>
                  This action is irreversible.
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img
                src={novelToDelete.cover_image}
                alt={novelToDelete.title}
                style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <div>
                <div style={{ fontWeight: '800', color: '#000000', fontSize: '14px' }}>{novelToDelete.title}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>{novelToDelete.total_chapters || 0} chapters will be deleted from database and Cloudflare R2</div>
              </div>
            </div>

            <p style={{ color: '#1f2937', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{novelToDelete.title}"</strong>? All chapters, locking rules, and reader records will be permanently erased.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setNovelToDelete(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#000000',
                  border: '1px solid #cbd5e1',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER CONTENT EDITOR MODAL */}
      {editingChapter && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '2px solid #cbd5e1'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' }}>
                  Chapter Content Editor
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#000000', margin: '2px 0 0' }}>
                  {editingChapter.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingChapter(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: '700', color: '#000000' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>AI Translation Assistant (Optional - Paste Raw Korean/Foreign Text)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <textarea
                    rows={3}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Paste foreign text here to auto-translate..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    style={{
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      padding: '0 18px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: isTranslating ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isTranslating ? 'Translating...' : '🤖 Translate'}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>English Story Content (Live Reader Text)</label>
                <textarea
                  rows={14}
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditingChapter(null)}
                style={{ background: '#f1f5f9', color: '#000000', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={saveContent}
                disabled={isSaving}
                style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isSaving ? 'Saving...' : '💾 Save Chapter Content'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
