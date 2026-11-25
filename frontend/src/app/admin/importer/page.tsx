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
        headers: { 'Content-Type': 'multipart/form-data' }
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

      const res = await axios.post(`${API_URL}/admin/save-parsed-book`, payload);

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
      });

      toast.success(`Success! Created ${manualTitle} with ${res.data.count} chapters!`, { id: 'manual-import' });
      setManualTitle(''); setManualAltTitle(''); setManualAuthor(''); setManualYear(''); setManualCoverUrl(''); setManualGenres(''); setManualDescription(''); setManualBulkText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed', { id: 'manual-import' });
    } finally {
      setIsManualImporting(false);
    }
  };

  // Universal strictly black text styles
  const textBlack = { color: '#000000' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#000000', marginBottom: '6px' };
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px', color: '#000000' }}>
      
      {/* Header */}
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#000000', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Novel & Chapter Importer
        </h1>
        <p style={{ color: '#1f2937', fontSize: '15px' }}>
          Directly upload <strong>.epub</strong> or <strong>.pdf</strong> files. The system auto-scrapes book covers, titles, authors, synopsis, and extracts all chapters with <strong>50 chapters free</strong> and remaining locked at <strong>10 coins</strong>.
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('smart')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            background: activeTab === 'smart' ? '#6366f1' : '#f1f5f9',
            color: activeTab === 'smart' ? '#ffffff' : '#000000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚡</span> EPUB & PDF Auto-Importer
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            background: activeTab === 'manual' ? '#6366f1' : '#f1f5f9',
            color: activeTab === 'manual' ? '#ffffff' : '#000000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📝</span> Manual Text Paste Importer
        </button>
      </div>

      {/* SUCCESS BANNER */}
      {uploadSuccess && (
        <div style={{
          background: '#ecfdf5',
          border: '2px solid #10b981',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#065f46', marginBottom: '4px' }}>
              🎉 Novel Successfully Published!
            </h3>
            <p style={{ color: '#047857', fontSize: '14px', margin: 0 }}>
              <strong>{uploadSuccess.title}</strong> is now live on SegyeNovels with <strong>{uploadSuccess.count} chapters</strong> (50 Free, remainder 10 Coins).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href={`/novel/${uploadSuccess.novelId}`}
              target="_blank"
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              👁️ View Live Novel
            </Link>
            <Link
              href="/admin/novels"
              style={{
                background: '#ffffff',
                color: '#065f46',
                border: '1.5px solid #10b981',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              📚 Manage Novels
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
              background: '#ffffff',
              border: '2px dashed #94a3b8',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              marginBottom: '32px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#000000', marginBottom: '8px' }}>
                Select an EPUB or PDF Novel File
              </h2>
              <p style={{ color: '#374151', fontSize: '14px', maxWidth: '520px', margin: '0 auto 24px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                <label
                  htmlFor="book-upload-input"
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
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
                <div style={{ marginTop: '16px', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                  Selected: <strong>{file.name}</strong> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {/* FINALIZING PREVIEW SCREEN */}
          {parsedBook && (
            <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '24px', padding: '36px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '28px' }}>
                <div>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    Finalizing Preview ({parsedBook.format.toUpperCase()})
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#000000', marginTop: '6px' }}>
                    Review Novel Metadata & Chapters
                  </h2>
                </div>
                
                <button
                  onClick={() => { setParsedBook(null); setFile(null); }}
                  style={{
                    background: '#f1f5f9',
                    color: '#000000',
                    border: '1px solid #cbd5e1',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Discard & Upload Another
                </button>
              </div>

              {/* Grid: Left Metadata / Right Stats & Chapters */}
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', marginBottom: '32px' }}>
                
                {/* Left: Cover & Metadata */}
                <div>
                  <label style={labelStyle}>Scraped Cover Artwork</label>
                  <div style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    border: '1.5px solid #cbd5e1',
                    marginBottom: '12px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                  }}>
                    {parsedBook.cover_image ? (
                      <img src={parsedBook.cover_image} alt={parsedBook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
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
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Chapters</span>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#000000', marginTop: '4px' }}>{parsedBook.chapters.length}</div>
                    </div>
                    <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Free Chapters</span>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#065f46', marginTop: '4px' }}>
                        {parsedBook.free_chapters} <span style={{ fontSize: '12px', fontWeight: '600' }}>(Ch 1 - {parsedBook.free_chapters})</span>
                      </div>
                    </div>
                    <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>Coin Locked (10 Coins)</span>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#78350f', marginTop: '4px' }}>
                        {parsedBook.locked_chapters} <span style={{ fontSize: '12px', fontWeight: '600' }}>(Ch 51+)</span>
                      </div>
                    </div>
                  </div>

                  {/* Chapter List Preview with Scroll */}
                  <label style={labelStyle}>Extracted Chapters ({parsedBook.chapters.length})</label>
                  <div style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    background: '#f8fafc'
                  }}>
                    {parsedBook.chapters.map((ch, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: idx < parsedBook.chapters.length - 1 ? '1px solid #e2e8f0' : 'none',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', minWidth: '40px' }}>
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
                              color: '#000000',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              width: '280px'
                            }}
                            onFocus={e => e.currentTarget.style.border = '1px solid #cbd5e1'}
                            onBlur={e => e.currentTarget.style.border = '1px solid transparent'}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            ~{ch.wordCount} words
                          </span>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: ch.tier === 'free' ? '#d1fae5' : '#fef3c7',
                            color: ch.tier === 'free' ? '#065f46' : '#92400e',
                            border: ch.tier === 'free' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                          }}>
                            {ch.tier === 'free' ? 'FREE' : '10 COINS'}
                          </span>

                          <button
                            onClick={() => setPreviewChapter(ch)}
                            style={{
                              background: '#f1f5f9',
                              color: '#000000',
                              border: '1px solid #cbd5e1',
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                <button
                  onClick={() => { setParsedBook(null); setFile(null); }}
                  style={{
                    background: '#f1f5f9',
                    color: '#000000',
                    border: '1.5px solid #cbd5e1',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px 36px',
                    borderRadius: '10px',
                    fontWeight: '900',
                    fontSize: '15px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isUploading ? '🚀 Uploading Novel & Syncing Chapters...' : `🚀 Confirm & Upload "${parsedBook.title}" to Site`}
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 2: MANUAL TEXT IMPORT (Original Raw Paste Wizard) */}
      {activeTab === 'manual' && (
        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '24px', padding: '36px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#000000', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>
            Manual Text & Chapter Slicer
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: isManualImporting ? 'not-allowed' : 'pointer'
            }}
          >
            {isManualImporting ? 'Creating Novel & Slicing...' : 'Publish Novel & Chapters'}
          </button>
        </div>
      )}

      {/* CHAPTER CONTENT INSPECTION MODAL */}
      {previewChapter && (
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
            maxWidth: '750px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '2px solid #cbd5e1'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' }}>
                  Chapter Inspection
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#000000', margin: '2px 0 0' }}>
                  {previewChapter.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewChapter(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: '700', color: '#000000' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '14px', lineHeight: '1.7', color: '#000000' }}>
              {Array.isArray(previewChapter.content) ? (
                previewChapter.content.map((p, idx) => (
                  <p key={idx} style={{ marginBottom: '14px', color: '#000000' }}>{p}</p>
                ))
              ) : (
                <p style={{ color: '#000000' }}>{previewChapter.content}</p>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewChapter(null)}
                style={{ background: '#6366f1', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
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
