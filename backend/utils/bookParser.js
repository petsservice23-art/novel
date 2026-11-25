const AdmZip = require('adm-zip');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const path = require('path');

/**
 * Clean and normalize text paragraphs
 */
function cleanParagraphs(rawText) {
  if (Array.isArray(rawText)) {
    return rawText.map(t => t.trim()).filter(t => t.length > 0);
  }
  return rawText
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0);
}

/**
 * Parse an EPUB buffer
 */
async function parseEpub(buffer) {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();

  // 1. Locate container.xml to find the root OPF file
  const containerEntry = zipEntries.find(e => e.entryName === 'META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('Invalid EPUB file: META-INF/container.xml not found.');
  }

  const containerXml = containerEntry.getData().toString('utf8');
  const container$ = cheerio.load(containerXml, { xmlMode: true });
  const opfPath = container$('rootfile').attr('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB file: Root OPF path not specified.');
  }

  const opfDir = path.dirname(opfPath);
  const opfEntry = zipEntries.find(e => e.entryName === opfPath);
  if (!opfEntry) {
    throw new Error(`OPF package file not found at ${opfPath}`);
  }

  const opfXml = opfEntry.getData().toString('utf8');
  const opf$ = cheerio.load(opfXml, { xmlMode: true });

  // 2. Extract Metadata
  let title = opf$('metadata dc\\:title').first().text().trim() ||
              opf$('metadata title').first().text().trim() ||
              'Untitled Novel';

  let author = opf$('metadata dc\\:creator').first().text().trim() ||
               opf$('metadata creator').first().text().trim() ||
               'Unknown Author';

  let description = opf$('metadata dc\\:description').text().trim() ||
                    opf$('metadata description').text().trim() ||
                    '';

  // Strip HTML from description if present
  if (description.includes('<') && description.includes('>')) {
    description = cheerio.load(description).text().trim();
  }

  let dateRaw = opf$('metadata dc\\:date').text().trim() || opf$('metadata date').text().trim() || '';
  let published_year = '';
  const yearMatch = dateRaw.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    published_year = yearMatch[1];
  } else {
    published_year = new Date().getFullYear().toString();
  }

  // 3. Extract Cover Image
  let coverDataUrl = '';
  try {
    // Check meta name="cover"
    let coverId = opf$('meta[name="cover"]').attr('content');
    let coverItem = null;

    if (coverId) {
      coverItem = opf$(`manifest item[id="${coverId}"]`);
    }

    // Fallback: search for item with properties="cover-image" or id/href containing cover
    if (!coverItem || !coverItem.length) {
      coverItem = opf$('manifest item[properties*="cover-image"]');
    }
    if (!coverItem || !coverItem.length) {
      opf$('manifest item').each((_, el) => {
        const id = opf$(el).attr('id') || '';
        const href = opf$(el).attr('href') || '';
        const mediaType = opf$(el).attr('media-type') || '';
        if (mediaType.startsWith('image/') && (id.toLowerCase().includes('cover') || href.toLowerCase().includes('cover'))) {
          coverItem = opf$(el);
          return false;
        }
      });
    }

    if (coverItem && coverItem.length) {
      const coverHref = coverItem.attr('href');
      const mediaType = coverItem.attr('media-type') || 'image/jpeg';
      const fullCoverPath = opfDir === '.' ? coverHref : path.posix.join(opfDir, coverHref);
      const coverEntry = zipEntries.find(e => e.entryName === fullCoverPath || e.entryName.endsWith(coverHref));
      if (coverEntry) {
        const coverBuf = coverEntry.getData();
        coverDataUrl = `data:${mediaType};base64,${coverBuf.toString('base64')}`;
      }
    }
  } catch (err) {
    console.warn('Cover extraction warning:', err.message);
  }

  // 4. Extract Manifest Items & Spine order
  const manifestMap = new Map();
  opf$('manifest item').each((_, el) => {
    const id = opf$(el).attr('id');
    const href = opf$(el).attr('href');
    const mediaType = opf$(el).attr('media-type') || '';
    if (id && href) {
      manifestMap.set(id, { href, mediaType });
    }
  });

  const spineIdRefs = [];
  opf$('spine itemref').each((_, el) => {
    const idref = opf$(el).attr('idref');
    if (idref) spineIdRefs.push(idref);
  });

  // 5. Read Chapters
  const rawChapters = [];

  for (const idref of spineIdRefs) {
    const item = manifestMap.get(idref);
    if (!item) continue;
    
    // Only process HTML/XHTML documents
    if (!item.mediaType.includes('html') && !item.mediaType.includes('xml')) continue;

    const fullItemPath = opfDir === '.' ? item.href : path.posix.join(opfDir, item.href);
    const docEntry = zipEntries.find(e => e.entryName === fullItemPath || e.entryName.endsWith(item.href));
    if (!docEntry) continue;

    const docContent = docEntry.getData().toString('utf8');
    const doc$ = cheerio.load(docContent);

    // Extract title from headings or title tag
    let chapterTitle = doc$('h1, h2, h3').first().text().trim() ||
                       doc$('title').first().text().trim() ||
                       '';

    // Extract paragraphs
    let paragraphs = [];
    doc$('p').each((_, el) => {
      const text = doc$(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 0) paragraphs.push(text);
    });

    // If no <p> tags, extract from blockquotes or divs or body text
    if (paragraphs.length === 0) {
      doc$('div, blockquote, li').each((_, el) => {
        const text = doc$(el).text().replace(/\s+/g, ' ').trim();
        if (text.length > 20) paragraphs.push(text);
      });
    }

    if (paragraphs.length === 0) {
      // Split raw body text by newlines
      const bodyText = doc$('body').text();
      paragraphs = cleanParagraphs(bodyText);
    }

    // Filter out very short boilerplate or navigation-only pages (unless it has story content)
    const totalWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
    const isCoverOrNav = totalWords < 35 && (
      chapterTitle.toLowerCase().includes('cover') ||
      chapterTitle.toLowerCase().includes('contents') ||
      chapterTitle.toLowerCase().includes('title') ||
      chapterTitle.toLowerCase().includes('copyright')
    );

    if (paragraphs.length > 0 && !isCoverOrNav && totalWords >= 20) {
      rawChapters.push({
        extractedTitle: chapterTitle,
        paragraphs,
        wordCount: totalWords
      });
    }
  }

  // 6. Format and apply SegyeNovels tier locking:
  // First 50 chapters are FREE, chapters > 50 are coin-locked (10 coins)
  const chapters = rawChapters.map((ch, idx) => {
    const chapterNum = idx + 1;
    let cleanTitle = ch.extractedTitle;

    // Normalize chapter title if generic or missing
    if (!cleanTitle || cleanTitle.toLowerCase() === 'untitled' || cleanTitle.length < 2) {
      cleanTitle = `Chapter ${chapterNum}`;
    } else if (!cleanTitle.toLowerCase().startsWith('chapter') && !cleanTitle.toLowerCase().startsWith('episode') && !cleanTitle.toLowerCase().startsWith('prologue')) {
      cleanTitle = `Chapter ${chapterNum}: ${cleanTitle}`;
    }

    const isFree = chapterNum <= 50;

    return {
      chapter_number: chapterNum,
      title: cleanTitle,
      content: ch.paragraphs,
      wordCount: ch.wordCount,
      tier: isFree ? 'free' : 'coin',
      is_locked: !isFree,
      price: isFree ? 0 : 10
    };
  });

  return {
    format: 'epub',
    title,
    author,
    published_year,
    description,
    cover_image: coverDataUrl,
    total_chapters: chapters.length,
    free_chapters: Math.min(50, chapters.length),
    locked_chapters: Math.max(0, chapters.length - 50),
    chapters
  };
}

/**
 * Parse a PDF buffer
 */
async function parsePdf(buffer) {
  const pdfData = await pdfParse(buffer);
  const text = pdfData.text || '';
  const info = pdfData.info || {};

  // Extract metadata
  let title = info.Title ? info.Title.trim() : '';
  let author = info.Author ? info.Author.trim() : 'Unknown Author';
  let published_year = new Date().getFullYear().toString();

  if (info.CreationDate) {
    const match = info.CreationDate.match(/\b(19\d{2}|20\d{2})\b/);
    if (match) published_year = match[1];
  }

  // Split text into lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Fallback title from first lines if info.Title is missing
  if (!title && lines.length > 0) {
    title = lines[0].slice(0, 60);
  }

  // Chapter delimiter pattern
  const chapterHeaderRegex = /^(?:Chapter|CHAPTER|Episode|EPISODE)\s*([IVXLCDM\d]+|[0-9]+)(?:[:.-]\s*(.*))?$/i;

  let rawChapters = [];
  let currentChapter = null;
  let prologueParagraphs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(chapterHeaderRegex);

    if (match) {
      // Flush previous chapter
      if (currentChapter && currentChapter.paragraphs.length > 0) {
        rawChapters.push(currentChapter);
      }
      currentChapter = {
        title: line,
        paragraphs: []
      };
    } else {
      if (currentChapter) {
        currentChapter.paragraphs.push(line);
      } else {
        // Text before Chapter 1 (often description or prologue)
        prologueParagraphs.push(line);
      }
    }
  }

  if (currentChapter && currentChapter.paragraphs.length > 0) {
    rawChapters.push(currentChapter);
  }

  // If no chapters matched by regex, split roughly by page marks or large blocks
  if (rawChapters.length === 0) {
    // Treat whole text as chunks
    const paragraphs = cleanParagraphs(text);
    const chunkSize = 25; // 25 paragraphs per chapter
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const slice = paragraphs.slice(i, i + chunkSize);
      const chNum = Math.floor(i / chunkSize) + 1;
      rawChapters.push({
        title: `Chapter ${chNum}`,
        paragraphs: slice
      });
    }
  }

  // Use prologue as synopsis if short
  let description = '';
  if (prologueParagraphs.length > 0) {
    description = prologueParagraphs.slice(0, 8).join('\n\n');
  }

  // Apply 50 free, rest coin locking
  const chapters = rawChapters.map((ch, idx) => {
    const chapterNum = idx + 1;
    const isFree = chapterNum <= 50;
    const wordCount = ch.paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);

    return {
      chapter_number: chapterNum,
      title: ch.title || `Chapter ${chapterNum}`,
      content: ch.paragraphs,
      wordCount,
      tier: isFree ? 'free' : 'coin',
      is_locked: !isFree,
      price: isFree ? 0 : 10
    };
  });

  return {
    format: 'pdf',
    title: title || 'Untitled PDF Novel',
    author,
    published_year,
    description: description || 'Imported from PDF document.',
    cover_image: '', // PDF covers will use fallback or manual URL
    total_chapters: chapters.length,
    free_chapters: Math.min(50, chapters.length),
    locked_chapters: Math.max(0, chapters.length - 50),
    chapters
  };
}

module.exports = {
  parseEpub,
  parsePdf
};
