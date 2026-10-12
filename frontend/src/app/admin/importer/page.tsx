'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function BulkImporter() {
  const [isImporting, setIsImporting] = useState(false);

  // Novel Metadata Fields
  const [title, setTitle] = useState('');
  const [altTitle, setAltTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [coverUrl, setCoverUrl] = useState('');
  const [genres, setGenres] = useState('');
  const [description, setDescription] = useState('');

  // Bulk Text Fields
  const [bulkText, setBulkText] = useState('');
  const [delimiter, setDelimiter] = useState('Chapter\\s+\\d+');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleImport = async () => {
    if (!title || !bulkText) {
      toast.error('Novel Title and Full Novel Text are required!');
      return;
    }

    setIsImporting(true);
    try {
      // 1. Create the Novel First
      toast.loading('Creating novel metadata...', { id: 'import' });
      const novelData = {
        title: title,
        alternative_titles: altTitle,
        author: author,
        published_year: year,
        publishing_status: status,
        cover_image: coverUrl || `https://picsum.photos/seed/${title}/400/600`, // fallback
        genres: genres.split(',').map(g => g.trim()).filter(g => g),
        description: description,
        total_chapters: 0,
        rating: 4.8 // Default high rating for new imports
      };

      const novelRes = await axios.post(`${API_URL}/admin/novels`, novelData);
      const newNovelId = novelRes.data._id;

      // 2. Import the Chapters
      toast.loading('Slicing chapters...', { id: 'import' });
      const res = await axios.post(`${API_URL}/admin/import-chapters`, {
        novel_id: newNovelId,
        text: bulkText,
        delimiter: delimiter
      });

      toast.success(`Success! Created ${title} with ${res.data.count} chapters!`, { id: 'import' });
      
      // Clear form
      setTitle(''); setAltTitle(''); setAuthor(''); setYear(''); setCoverUrl(''); setGenres(''); setDescription(''); setBulkText('');
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed', { id: 'import' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>Novel Creation Wizard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Instantly create a fully-fleshed novel and import all its chapters at once.</p>
      </header>

      <div style={{ display: 'grid', gap: '32px', background: 'var(--bg-secondary)', padding: '40px', borderRadius: '32px', border: '1px solid var(--border)' }}>
        
        {/* Section 1: Metadata */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
            1. Novel Overview & Metadata
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Novel Name *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Under the Oak Tree" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Also Known As</label>
              <input type="text" value={altTitle} onChange={e => setAltTitle(e.target.value)} placeholder="e.g. 상수리나무 아래" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Sooji Kim" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Publish Year</label>
              <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2017" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cover Image URL</label>
              <input type="text" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Genres (Comma separated)</label>
              <input type="text" value={genres} onChange={e => setGenres(e.target.value)} placeholder="Fantasy, Romance, Josei" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Synopsis / Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Write the novel description here..." style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          </div>
        </div>

        {/* Section 2: Chapters */}
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
            2. Bulk Chapter Import
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Split Delimiter (Regex)</label>
            <input type="text" value={delimiter} onChange={e => setDelimiter(e.target.value)} placeholder="e.g. Chapter\s+\d+" style={inputStyle} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              The pattern used to detect where a new chapter begins. Default matches "Chapter 1", "Chapter 2", etc.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Full Novel Text *</label>
            <textarea 
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="Paste the entire raw text of the novel here... The system will slice it up based on the delimiter!"
              style={{ ...inputStyle, height: '400px', resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <button 
          onClick={handleImport}
          disabled={isImporting}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '18px',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '800',
            border: 'none',
            cursor: isImporting ? 'not-allowed' : 'pointer',
            opacity: isImporting ? 0.7 : 1,
            boxShadow: '0 12px 30px rgba(var(--accent-rgb), 0.3)',
            transition: 'all 0.2s',
            marginTop: '20px'
          }}
        >
          {isImporting ? 'Processing Novel...' : '⚡ Create Novel & Slice Chapters'}
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--text-secondary)',
  marginBottom: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px'
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '14px 18px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
};
