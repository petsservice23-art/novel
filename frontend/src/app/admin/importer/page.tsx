'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ParsedChapter {
  chapter_number: number;
  title: string;
  content: string[];
  wordCount: number;
  tier: 'free' | 'coin';
  is_locked: boolean;
  price: number;
}

interface ParsedBook {
  format: 'epub' | 'pdf';
  title: string;
  author: string;
  published_year: string;
  alternative_titles?: string;
  publishing_status?: string;
  description: string;
  cover_image: string;
  genres?: string;
  total_chapters: number;
  free_chapters: number;
  locked_chapters: number;
  chapters: ParsedChapter[];
}

export default function BulkImporter() {
  const [activeTab, setActiveTab] = useState<'smart' | 'manual'>('smart');

  // --- Smart EPUB/PDF State ---
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedBook, setParsedBook] = useState<ParsedBook | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{ novelId: string; title: string; count: number } | null>(null);

  // Chapter content modal preview
  const [previewChapter, setPreviewChapter] = useState<ParsedChapter | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Manual Text State ---
  const [manualTitle, setManualTitle] = useState('');
  const [manualAltTitle, setManualAltTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualStatus, setManualStatus] = useState('ongoing');
  const [manualCoverUrl, setManualCoverUrl] = useState('');
  const [manualGenres, setManualGenres] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualBulkText, setManualBulkText] = useState('');
  const [manualDelimiter, setManualDelimiter] = useState('Chapter\\s+\\d+');
  const [isManualImporting, setIsManualImporting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // 1. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith('.epub') && !ext.endsWith('.pdf')) {
        toast.error('Please upload an .epub or .pdf file');
        return;
      }
      setFile(selected);
      setParsedBook(null);
      setUploadSuccess(null);
    }
  };

  // 2. Parse EPUB / PDF via Backend
  const handleParseFile = async () => {
    if (!file) return toast.error('Please select an EPUB or PDF file first');
    setIsParsing(true);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('book', file);

    const parseToast = toast.loading(`Parsing ${file.name}... extracting cover, metadata & chapters`, { id: 'parse-book' });

    try {
      const res = await axios.post(`${API_URL}/admin/parse-book`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 // 5 minutes for parsing large book files
      });

      const data: ParsedBook = res.data;
      data.publishing_status = data.publishing_status || 'ongoing';
      data.genres = data.genres || 'Fantasy, Romance, Drama';
      setParsedBook(data);
      toast.success(`Parsed successfully! Found ${data.chapters.length} chapters.`, { id: 'parse-book' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to parse book file', { id: 'parse-book' });
    } finally {
      setIsParsing(false);
    }
  };

  // 3. Confirm & Upload Parsed Novel to Site
  const handleConfirmUpload = async () => {
    if (!parsedBook || !parsedBook.title) {
      toast.error('Novel metadata is required');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading(`Uploading "${parsedBook.title}" with ${parsedBook.chapters.length} chapters...`, { id: 'save-book' });

    try {
      const payload = {
        novel: {
          title: parsedBook.title,
          author: parsedBook.author || 'Korean Author',
          alternative_titles: parsedBook.alternative_titles || '',
          published_year: parsedBook.published_year || new Date().getFullYear().toString(),
          publishing_status: parsedBook.publishing_status || 'ongoing',
          description: parsedBook.description || '',
          cover_image: parsedBook.cover_image || `https://picsum.photos/seed/${encodeURIComponent(parsedBook.title)}/400/600`,
          genres: typeof parsedBook.genres === 'string' ? parsedBook.genres.split(',').map(g => g.trim()).filter(Boolean) : ['Fantasy']
        },
        chapters: parsedBook.chapters
      };

      const res = await axios.post(`${API_URL}/admin/save-parsed-book`, payload, {
        timeout: 600000, // 10 minutes for large books (200-500+ chapters)
        headers: { 'Content-Type': 'application/json' }
      });

      toast.success(`Success! Created "${parsedBook.title}" with ${res.data.chaptersCount} chapters live!`, { id: 'save-book' });
      setUploadSuccess({
        novelId: res.data.novel._id,
        title: parsedBook.title,
        count: res.data.chaptersCount
      });
      setParsedBook(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload novel to site', { id: 'save-book' });
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Manual Text Import
  const handleManualImport = async () => {
    if (!manualTitle || !manualBulkText) {
      toast.error('Novel Title and Full Novel Text are required!');
      return;
    }

    setIsManualImporting(true);
    try {
      toast.loading('Creating novel metadata...', { id: 'manual-import' });
      const novelData = {
        title: manualTitle,
        alternative_titles: manualAltTitle,
        author: manualAuthor,
        published_year: manualYear,
        publishing_status: manualStatus,
        cover_image: manualCoverUrl || `https://picsum.photos/seed/${manualTitle}/400/600`,
        genres: manualGenres.split(',').map(g => g.trim()).filter(Boolean),
        description: manualDescription,
        total_chapters: 0,
        rating: 4.8
      };

      const novelRes = await axios.post(`${API_URL}/admin/novels`, novelData);
      const newNovelId = novelRes.data._id;

      toast.loading('Slicing chapters...', { id: 'manual-import' });
      const res = await axios.post(`${API_URL}/admin/import-chapters`, {
        novel_id: newNovelId,
        text: manualBulkText,
        delimiter: manualDelimiter
      }, { timeout: 300000 });

      toast.success(`Success! Created ${manualTitle} with ${res.data.count} chapters!`, { id: 'manual-import' });
      setManualTitle(''); setManualAltTitle(''); setManualAuthor(''); setManualYear(''); setManualCoverUrl(''); setManualGenres(''); setManualDescription(''); setManualBulkText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed', { id: 'manual-import' });
    } finally {
      setIsManualImporting(false);
    }
  };

  // Dynamic theme-adaptive styling
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1.5px solid var(--border)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px', color: 'var(--text-primary)' }}>
      
      {/* Header */}
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Novel & Chapter Importer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Directly upload <strong>.epub</strong> or <strong>.pdf</strong> files. The system auto-scrapes book covers, titles, authors, synopsis, and extracts all chapters with <strong>50 chapters free</strong> and remaining locked at <strong>10 coins</strong>.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setActiveTab('smart')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'smart' ? 'none' : '1px solid var(--border)',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            background: activeTab === 'smart' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
            color: activeTab === 'smart' ? '#ffffff' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'smart' ? '0 2px 10px rgba(142, 107, 175, 0.35)' : 'none'
          }}
        >
          <span>⚡</span> EPUB & PDF Auto-Importer
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'manual' ? 'none' : '1px solid var(--border)',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            background: activeTab === 'manual' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
            color: activeTab === 'manual' ? '#ffffff' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'manual' ? '0 2px 10px rgba(142, 107, 175, 0.35)' : 'none'
          }}
        >
          <span>📝</span> Manual Text Paste Importer
        </button>
      </div>

      {/* SUCCESS BANNER */}
      {uploadSuccess && (
        <div
          className="rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-2"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981'
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginBottom: '4px' }}>
              🎉 Novel Successfully Published!
            </h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: 0 }}>
              <strong>{uploadSuccess.title}</strong> is now live on SegyeNovels with <strong>{uploadSuccess.count} chapters</strong> (50 Free, remainder 10 Coins).
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <Link
              href={`/novel/${uploadSuccess.novelId}`}
              target="_blank"
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
              className="flex-1 sm:flex-none"
            >
              👁️ View Live
            </Link>
            <Link
              href="/admin/novels"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1.5px solid #10b981',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
              className="flex-1 sm:flex-none"
            >
              📚 Manage
            </Link>
          </div>
        </div>
      )}

      {/* TAB 1: SMART EPUB / PDF IMPORTER */}
      {activeTab === 'smart' && (
        <div>
          {/* Upload Dropzone */}
          {!parsedBook && (
            <div style={{
              background: 'var(--bg-card)',
              border: '2px dashed var(--border)',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '32px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Select an EPUB or PDF Novel File
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '520px', margin: '0 auto 24px' }}>
                The scraper will read the internal book structure, extract the official cover, title, author, release year, synopsis, and slice all chapters cleanly.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="book-upload-input"
              />

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label
                  htmlFor="book-upload-input"
                  style={{
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    boxShadow: '0 4px 12px rgba(142, 107, 175, 0.35)'
                  }}
                >
                  📁 Browse EPUB / PDF File
                </label>

                {file && (
                  <button
                    onClick={handleParseFile}
                    disabled={isParsing}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '12px 28px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '15px',
                      border: 'none',
                      cursor: isParsing ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isParsing ? '⏳ Auto-Parsing Book...' : `⚡ Parse & Preview "${file.name}"`}
                  </button>
                )}
              </div>

              {file && (
                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Selected: <strong>{file.name}</strong> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {/* FINALIZING PREVIEW SCREEN */}
          {parsedBook && (
            <div
              className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)'
              }}
            >
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 mb-6 sm:mb-8" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    Finalizing Preview ({parsedBook.format.toUpperCase()})
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black mt-1.5 m-0" style={{ color: 'var(--text-primary)' }}>
                    Review Novel Metadata & Chapters
                  </h2>
                </div>
                
                <button
                  onClick={() => { setParsedBook(null); setFile(null); }}
                  className="px-3.5 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  ✕ Discard & Upload Another
                </button>
              </div>

              {/* Grid: Left Metadata / Right Stats & Chapters */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8 mb-6 sm:mb-8">
                
                {/* Left: Cover & Metadata */}
                <div>
                  <label style={labelStyle}>Scraped Cover Artwork</label>
                  <div style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border)',
                    marginBottom: '12px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {parsedBook.cover_image ? (
                      <img src={parsedBook.cover_image} alt={parsedBook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
                        <span>🖼️</span> No cover found in file
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Custom Cover URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://... cover image link"
                      value={parsedBook.cover_image.startsWith('data:') ? '' : parsedBook.cover_image}
                      onChange={e => setParsedBook({ ...parsedBook, cover_image: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Publishing Status</label>
                    <select
                      value={parsedBook.publishing_status}
                      onChange={e => setParsedBook({ ...parsedBook, publishing_status: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="hiatus">Hiatus</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Genres (comma-separated)</label>
                    <input
                      type="text"
                      value={parsedBook.genres}
                      onChange={e => setParsedBook({ ...parsedBook, genres: e.target.value })}
                      placeholder="Fantasy, Romance, Action"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Right: Text Fields & Chapters */}
                <div className="min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label style={labelStyle}>Novel Title *</label>
                      <input
                        type="text"
                        value={parsedBook.title}
                        onChange={e => setParsedBook({ ...parsedBook, title: e.target.value })}
                        style={{ ...inputStyle, fontWeight: '700', fontSize: '15px' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Author Name *</label>
                      <input
                        type="text"
                        value={parsedBook.author}
                        onChange={e => setParsedBook({ ...parsedBook, author: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label style={labelStyle}>Alternative Names / Subtitle</label>
                      <input
                        type="text"
                        value={parsedBook.alternative_titles || ''}
                        onChange={e => setParsedBook({ ...parsedBook, alternative_titles: e.target.value })}
                        placeholder="e.g. Original Korean Title"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Published Year</label>
                      <input
                        type="text"
                        value={parsedBook.published_year}
                        onChange={e => setParsedBook({ ...parsedBook, published_year: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Synopsis / Description</label>
                    <textarea
                      rows={5}
                      value={parsedBook.description}
                      onChange={e => setParsedBook({ ...parsedBook, description: e.target.value })}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                    />
                  </div>

                  {/* Locking Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div
                      className="rounded-xl p-3.5 text-center border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      <span className="text-[11px] font-bold uppercase block" style={{ color: 'var(--text-muted)' }}>Total Chapters</span>
                      <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{parsedBook.chapters.length}</div>
                    </div>
                    <div
                      className="rounded-xl p-3.5 text-center border"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        borderColor: 'rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <span className="text-[11px] font-extrabold uppercase block" style={{ color: '#10b981' }}>Free Chapters</span>
                      <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: '#10b981' }}>
                        {parsedBook.free_chapters} <span className="text-xs font-semibold" style={{ color: '#059669' }}>(Ch 1 - {parsedBook.free_chapters})</span>
                      </div>
                    </div>
                    <div
                      className="rounded-xl p-3.5 text-center border"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        borderColor: 'rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <span className="text-[11px] font-extrabold uppercase block" style={{ color: '#f59e0b' }}>Coin Locked (10 Coins)</span>
                      <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: '#f59e0b' }}>
                        {parsedBook.locked_chapters} <span className="text-xs font-semibold" style={{ color: '#d97706' }}>(Ch 51+)</span>
                      </div>
                    </div>
                  </div>

                  {/* Chapter List Preview with Scroll */}
                  <label style={labelStyle}>Extracted Chapters ({parsedBook.chapters.length})</label>
                  <div style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    background: 'var(--bg-card)'
                  }}>
                    {parsedBook.chapters.map((ch, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: idx < parsedBook.chapters.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: 'var(--bg-card)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', minWidth: '40px' }}>
                            #{ch.chapter_number}
                          </span>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => {
                              const updated = [...parsedBook.chapters];
                              updated[idx].title = e.target.value;
                              setParsedBook({ ...parsedBook, chapters: updated });
                            }}
                            style={{
                              border: '1px solid transparent',
                              background: 'transparent',
                              fontWeight: '700',
                              fontSize: '13px',
                              color: 'var(--text-primary)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              width: '280px'
                            }}
                            onFocus={e => e.currentTarget.style.border = '1px solid var(--border)'}
                            onBlur={e => e.currentTarget.style.border = '1px solid transparent'}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ~{ch.wordCount} words
                          </span>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: ch.tier === 'free' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: ch.tier === 'free' ? '#10b981' : '#f59e0b',
                            border: ch.tier === 'free' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            {ch.tier === 'free' ? 'FREE' : '10 COINS'}
                          </span>

                          <button
                            onClick={() => setPreviewChapter(ch)}
                            style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Inspect Content
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Bottom Confirm Bar */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => { setParsedBook(null); setFile(null); }}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-sm cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="w-full sm:w-auto text-white border-0 py-3 px-6 rounded-xl font-black text-sm cursor-pointer shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 4px 14px rgba(142, 107, 175, 0.35)'
                  }}
                >
                  {isUploading ? '🚀 Uploading Novel & Syncing Chapters...' : `🚀 Confirm & Upload "${parsedBook.title.slice(0, 22)}${parsedBook.title.length > 22 ? '...' : ''}" to Site`}
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 2: MANUAL TEXT IMPORT (Original Raw Paste Wizard) */}
      {activeTab === 'manual' && (
        <div
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
            Manual Text & Chapter Slicer
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Novel Name *</label>
              <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="e.g. Under the Oak Tree" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Also Known As</label>
              <input type="text" value={manualAltTitle} onChange={e => setManualAltTitle(e.target.value)} placeholder="e.g. 상수리나무 아래" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input type="text" value={manualAuthor} onChange={e => setManualAuthor(e.target.value)} placeholder="e.g. Sooji Kim" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Published Year</label>
              <input type="text" value={manualYear} onChange={e => setManualYear(e.target.value)} placeholder="e.g. 2024" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Status</label>
              <select value={manualStatus} onChange={e => setManualStatus(e.target.value)} style={inputStyle}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Cover Image URL</label>
              <input type="text" value={manualCoverUrl} onChange={e => setManualCoverUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Genres (comma-separated)</label>
            <input type="text" value={manualGenres} onChange={e => setManualGenres(e.target.value)} placeholder="Fantasy, Romance, Drama" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Novel Synopsis / Description</label>
            <textarea rows={4} value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Write description here..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Chapter Slicing Delimiter (Regex)</label>
            <input type="text" value={manualDelimiter} onChange={e => setManualDelimiter(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Full Novel Text (Paste all raw chapters)</label>
            <textarea rows={10} value={manualBulkText} onChange={e => setManualBulkText(e.target.value)} placeholder="Chapter 1: The Beginning...&#10;&#10;Chapter 2: The Journey..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <button
            onClick={handleManualImport}
            disabled={isManualImporting}
            style={{
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: isManualImporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(142, 107, 175, 0.35)'
            }}
          >
            {isManualImporting ? 'Creating Novel & Slicing...' : 'Publish Novel & Chapters'}
          </button>
        </div>
      )}

      {/* CHAPTER CONTENT INSPECTION MODAL */}
      {previewChapter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5">
          <div
            className="rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border-2"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="p-4 sm:p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--accent)' }}>
                  Chapter Inspection
                </span>
                <h3 className="text-base sm:text-lg font-black m-0 mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {previewChapter.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewChapter(null)}
                className="border-0 rounded-full w-8 h-8 cursor-pointer font-bold flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)'
                }}
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {Array.isArray(previewChapter.content) ? (
                previewChapter.content.map((p, idx) => (
                  <p key={idx} className="mb-3">{p}</p>
                ))
              ) : (
                <p>{previewChapter.content}</p>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setPreviewChapter(null)}
                className="text-white border-0 py-2 px-5 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                style={{ background: 'var(--accent-gradient)' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
