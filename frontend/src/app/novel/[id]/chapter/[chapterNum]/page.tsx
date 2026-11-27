import { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { fetchNovelById, fetchChapterByNum } from '@/utils/ssrApi';
import ChapterReaderClient from '@/components/ChapterReaderClient';

interface PageProps {
  params: Promise<{ id: string; chapterNum: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, chapterNum } = await params;
  const num = parseInt(chapterNum, 10) || 1;

  const [novel, chapter] = await Promise.all([
    fetchNovelById(id),
    fetchChapterByNum(id, num)
  ]);

  if (!novel) {
    return {
      title: 'Chapter Not Found | SegyeNovels',
      description: 'The requested novel chapter could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const chapterTitle = chapter?.title || `Chapter ${num}`;
  const isHidden = novel.is_hidden || novel.status === 'hidden';
  const titleStr = `${novel.title} - Chapter ${num}: ${chapterTitle} | Read Online SegyeNovels`;
  const descStr = `Read ${novel.title} Chapter ${num} online for free. Continue following ${novel.title} (${novel.author || 'Korean Author'}) in English translation on SegyeNovels.`;

  return {
    title: titleStr,
    description: descStr,
    alternates: {
      canonical: `https://www.segyenovels.space/novel/${id}/chapter/${num}`,
    },
    openGraph: {
      title: titleStr,
      description: descStr,
      url: `https://www.segyenovels.space/novel/${id}/chapter/${num}`,
      type: 'article',
      images: [
        {
          url: novel.cover_image || '/images/logo-wordmark.png',
          width: 800,
          height: 1200,
          alt: `${novel.title} Chapter ${num}`,
        },
      ],
      siteName: 'SegyeNovels',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleStr,
      description: descStr,
      images: [novel.cover_image || '/images/logo-wordmark.png'],
    },
    robots: isHidden ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function ChapterReadingPage({ params }: PageProps) {
  const { id, chapterNum } = await params;
  const num = parseInt(chapterNum, 10) || 1;

  // Retrieve incoming Cookie header to pass auth to backend if user is logged in
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') || null;

  const [novel, chapter] = await Promise.all([
    fetchNovelById(id),
    fetchChapterByNum(id, num, cookieHeader)
  ]);

  if (!novel || !chapter) {
    return (
      <div style={{ minHeight: '80vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '16px', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--text-primary)', fontWeight: '700' }}>Chapter Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>We couldn&apos;t load Chapter {num} for this novel.</p>
        <Link href={`/novel/${id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Novel Index
        </Link>
      </div>
    );
  }

  const isLocked = Boolean(chapter.is_locked);
  const rawContent = chapter.content;

  // Compute word count and estimated reading time
  let wordCount = 0;
  if (Array.isArray(rawContent)) {
    wordCount = rawContent.join(' ').trim().split(/\s+/).filter(Boolean).length;
  } else if (typeof rawContent === 'string') {
    wordCount = rawContent.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  }
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const totalChapters = novel.total_chapters || 0;
  const prevChapter = num > 1 ? num - 1 : null;
  const nextChapter = (totalChapters === 0 || num < totalChapters) ? num + 1 : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.segyenovels.space"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": novel.title,
        "item": `https://www.segyenovels.space/novel/${id}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `Chapter ${num}`,
        "item": `https://www.segyenovels.space/novel/${id}/chapter/${num}`
      }
    ]
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${novel.title} - Chapter ${num}: ${chapter.title}`,
    "articleSection": novel.genres?.[0] || "Web Novel",
    "author": {
      "@type": "Person",
      "name": novel.author || "Korean Author"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SegyeNovels",
      "url": "https://www.segyenovels.space"
    },
    "isPartOf": {
      "@type": "Book",
      "name": novel.title,
      "url": `https://www.segyenovels.space/novel/${id}`
    },
    "wordCount": wordCount,
    "timeRequired": `PT${readTime}M`
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      fontFamily: 'Merriweather, Georgia, serif', 
      paddingBottom: '120px', 
      transition: 'background-color 0.3s, color 0.3s' 
    }}>
      {/* Schema.org Article & Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Client-side Reader Shell: Navigation, Font-size adjustment, Audio TTS, Unlock handlers */}
      <ChapterReaderClient
        novel={novel}
        chapter={chapter}
        chapterNum={num}
        novelId={id}
        isLocked={isLocked}
      />

      {/* Main Chapter Content Container (Raw SSR HTML for Googlebot and Readers) */}
      <main style={{ maxWidth: '740px', margin: '36px auto 0', padding: '0 24px' }}>
        
        {/* Semantic Breadcrumbs (visible for crawlers and humans) */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <Link href={`/novel/${id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{novel.title}</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Chapter {num}</span>
        </nav>

        {/* Chapter Header Block */}
        <header style={{ textAlign: 'center', marginBottom: '36px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <p style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            {novel.title}
          </p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', marginBottom: '18px', color: 'var(--text-primary)', lineHeight: 1.35 }}>
            {chapter.title || `Chapter ${num}`}
          </h1>

          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid var(--border)', 
            background: 'var(--bg-secondary)',
            borderRadius: '100px', 
            padding: '6px 18px',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <span>{wordCount.toLocaleString()} words</span>
            <span>&bull;</span>
            <span>{readTime} min read</span>
          </div>
        </header>

        {/* Chapter Article Body - Rendered directly by Next.js Server */}
        <article 
          className="chapter-content-body"
          style={{ 
            fontSize: '18px', 
            lineHeight: '2.1', 
            color: 'var(--text-primary)',
            textAlign: 'left',
            filter: isLocked ? 'blur(6px)' : 'none',
            userSelect: isLocked ? 'none' : 'auto'
          }}
        >
          {Array.isArray(rawContent) ? (
            rawContent.map((paragraph: string, idx: number) => (
              <p key={idx} style={{ marginBottom: '1.6em', whiteSpace: 'pre-line' }}>
                {paragraph}
              </p>
            ))
          ) : typeof rawContent === 'string' && rawContent.includes('<') ? (
            <div dangerouslySetInnerHTML={{ __html: rawContent }} style={{ display: 'flex', flexDirection: 'column', gap: '1.6em' }} />
          ) : typeof rawContent === 'string' ? (
            rawContent.split(/\r?\n\r?\n/).map((paragraph: string, idx: number) => (
              <p key={idx} style={{ marginBottom: '1.6em', whiteSpace: 'pre-line' }}>
                {paragraph}
              </p>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {isLocked ? 'This premium chapter is locked. Unlock to read the full story.' : 'No chapter content loaded.'}
            </p>
          )}
        </article>

        {/* Semantic Next / Previous Chapter Links in static HTML for Crawlers */}
        {!isLocked && (
          <footer style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid var(--border)', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
              Finished reading Chapter {num}?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {prevChapter && (
                <Link 
                  href={`/novel/${id}/chapter/${prevChapter}`}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '100px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  ← Chapter {prevChapter}
                </Link>
              )}
              {nextChapter ? (
                <Link 
                  href={`/novel/${id}/chapter/${nextChapter}`}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '100px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  Chapter {nextChapter} →
                </Link>
              ) : (
                <Link 
                  href={`/novel/${id}`}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '100px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  Back to Novel Index
                </Link>
              )}
            </div>
          </footer>
        )}

      </main>
    </div>
  );
}
