import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { fetchNovelById, fetchNovelChapters, fetchAllNovels } from '@/utils/ssrApi';
import NovelInteractiveClient from '@/components/NovelInteractiveClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const novel = await fetchNovelById(id);

  if (!novel) {
    return {
      title: 'Novel Not Found | SegyeNovels',
      description: 'The requested web novel could not be found on SegyeNovels.',
      robots: { index: false, follow: false },
    };
  }

  const isHidden = novel.is_hidden || novel.status === 'hidden';
  const cleanDesc = novel.description 
    ? novel.description.replace(/\r?\n|\r/g, ' ').slice(0, 155) + '...'
    : `Read ${novel.title} online for free on SegyeNovels. Explore high quality Korean web novel translations with daily updates.`;

  const titleStr = `${novel.title} - Read Online All Chapters | SegyeNovels`;
  const canonicalSlug = novel.slug || id;

  return {
    title: titleStr,
    description: cleanDesc,
    alternates: {
      canonical: `https://www.segyenovels.space/novel/${canonicalSlug}`,
    },
    openGraph: {
      title: titleStr,
      description: cleanDesc,
      url: `https://www.segyenovels.space/novel/${canonicalSlug}`,
      type: 'book',
      images: [
        {
          url: novel.cover_image || '/images/logo-wordmark.png',
          width: 800,
          height: 1200,
          alt: `${novel.title} Cover Artwork`,
        },
      ],
      siteName: 'SegyeNovels',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleStr,
      description: cleanDesc,
      images: [novel.cover_image || '/images/logo-wordmark.png'],
    },
    robots: isHidden ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function NovelDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [novel, chapters, allNovels] = await Promise.all([
    fetchNovelById(id),
    fetchNovelChapters(id),
    fetchAllNovels()
  ]);

  if (!novel) {
    return (
      <div style={{ minHeight: '80vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '16px', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: '700' }}>Novel Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This story may have been relocated or is currently unavailable.</p>
        <Link href="/browse" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
          ← Return to Novel Library
        </Link>
      </div>
    );
  }

  // 301 Permanent Redirect: If visitor or Googlebot hits raw MongoDB ID, redirect to clean keyword slug!
  if (novel.slug && id !== novel.slug) {
    permanentRedirect(`/novel/${novel.slug}`);
  }

  const canonicalSlug = novel.slug || id;
  const isCompleted = (novel.publishing_status || 'completed').toLowerCase() === 'completed';
  const freeChaptersCount = chapters.filter(c => c.tier === 'free' || (!c.is_locked && c.chapter_number <= 50)).length;

  // Find 6 similar/recommended novels from the same genres
  const relatedNovels = allNovels
    .filter(n => (n.slug || n._id) !== canonicalSlug && n._id !== novel._id)
    .filter(n => n.genres?.some(g => novel.genres?.includes(g)))
    .slice(0, 6);

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
        "name": "Browse Novels",
        "item": "https://www.segyenovels.space/browse"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": novel.title,
        "item": `https://www.segyenovels.space/novel/${canonicalSlug}`
      }
    ]
  };

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `https://www.segyenovels.space/novel/${canonicalSlug}#book`,
    "name": novel.title,
    "alternateName": novel.alternative_titles ? novel.alternative_titles.split(',').map(s => s.trim()) : undefined,
    "author": {
      "@type": "Person",
      "name": novel.author || "Korean Author"
    },
    "description": novel.description,
    "genre": novel.genres,
    "datePublished": novel.published_year || "2022",
    "numberOfPages": novel.total_chapters || chapters.length,
    "inLanguage": "en",
    "publisher": {
      "@type": "Organization",
      "name": "SegyeNovels",
      "url": "https://www.segyenovels.space"
    },
    "image": novel.cover_image,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": novel.rating || 4.8,
      "ratingCount": novel.ratings_count || 120,
      "bestRating": 5,
      "worstRating": 1
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      transition: 'background-color 0.2s, color 0.2s' 
    }}>
      {/* Schema.org Structured Data (Book + Breadcrumbs) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />

      {/* Semantic Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: 0, gap: '8px' }}>
          <li>
            <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link href="/browse" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Novels</Link>
          </li>
          {novel.genres?.[0] && (
            <>
              <li aria-hidden="true">&gt;</li>
              <li>
                <Link href={`/genres/${encodeURIComponent(novel.genres[0].toLowerCase().trim().replace(/\s+/g, '-'))}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {novel.genres[0]}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">&gt;</li>
          <li style={{ color: 'var(--text-primary)', fontWeight: '600', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} aria-current="page">
            {novel.title}
          </li>
        </ol>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Cover Image Artwork */}
        <div style={{ 
          width: '230px', 
          aspectRatio: '2/3', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          marginBottom: '24px', 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)'
        }}>
          <img 
            src={novel.cover_image || `https://picsum.photos/seed/${novel._id}/400/600`} 
            alt={`${novel.title} Web Novel Cover - Read on SegyeNovels`} 
            width={230}
            height={345}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            loading="eager"
          />
        </div>

        {/* Primary H1 Title */}
        <h1 style={{ 
          fontSize: 'clamp(26px, 4vw, 36px)', 
          fontWeight: '800', 
          marginBottom: '8px', 
          textAlign: 'center', 
          letterSpacing: '-0.02em', 
          color: 'var(--text-primary)',
          lineHeight: '1.25'
        }}>
          {novel.title}
        </h1>
        
        {/* Hangul / Alternate Titles for SEO aliases */}
        {novel.alternative_titles && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', marginBottom: '20px' }}>
            <span>Also known as: <i>{novel.alternative_titles}</i></span>
          </div>
        )}

        {/* Author Byline */}
        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
          <span>Written by </span>
          <strong style={{ color: 'var(--text-primary)' }}>{novel.author || 'Korean Author'}</strong>
        </div>

        {/* Badges / Quick Metadata */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={badgeStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {novel.published_year || '2022'}
          </div>
          <div style={{ 
            ...badgeStyle, 
            color: isCompleted ? '#10b981' : '#3b82f6', 
            background: isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: '600'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isCompleted ? '#10b981' : '#3b82f6', display: 'inline-block' }} />
            {isCompleted ? 'Completed' : 'Ongoing'}
          </div>
          <div style={badgeStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            {novel.total_chapters || chapters.length} Chapters
          </div>
          <div style={badgeStyle}>
            <span style={{ color: '#10b981', fontWeight: '700' }}>✓ {freeChaptersCount} Free Chapters</span>
          </div>
          <div style={badgeStyle}>
            <span style={{ color: '#f59e0b', fontWeight: '700' }}>★ {novel.rating ? novel.rating.toFixed(1) : '4.8'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({novel.ratings_count || 120})</span>
          </div>
        </div>

        {/* Genre Tags */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
          {(novel.genres || ['Fantasy', 'Action', 'Romance']).map((g) => {
            const genreSlug = g.toLowerCase().trim().replace(/\s+/g, '-');
            return (
              <Link 
                key={g} 
                href={`/genres/${encodeURIComponent(genreSlug)}`}
                style={{ textDecoration: 'none' }}
              >
                <span style={tagStyle}>
                  {g}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Primary Call to Action */}
        <div style={{ marginBottom: '36px', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={`/novel/${canonicalSlug}/chapter/1`} style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg, var(--accent), #e11d48)',
              color: '#fff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              Start Reading (Chapter 1) →
            </button>
          </Link>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '32px' }} />

        {/* Full Synopsis Section (Crawlable by Googlebot) */}
        <section aria-labelledby="synopsis-heading" style={{ width: '100%', textAlign: 'left', marginBottom: '36px' }}>
          <h2 id="synopsis-heading" style={{ fontSize: '20px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>
            Synopsis
          </h2>
          <div style={{ 
            color: 'var(--text-secondary)', 
            lineHeight: '1.85', 
            fontSize: '15px', 
            whiteSpace: 'pre-wrap',
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid var(--border)'
          }}>
            {novel.description || 'No detailed synopsis available yet for this web novel.'}
          </div>
        </section>

        {/* Interactive Chapters Client with Search, Range Tabs, Library & Unlock-All */}
        <section style={{ width: '100%' }}>
          <NovelInteractiveClient novel={{ ...novel, _id: canonicalSlug }} chapters={chapters} />
        </section>

        {/* Recommended / Similar Novels (Internal link SEO & Retention) */}
        {relatedNovels.length > 0 && (
          <section aria-labelledby="related-heading" style={{ width: '100%', marginTop: '54px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 id="related-heading" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Readers Also Enjoyed
              </h2>
              <Link href="/browse" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                Browse All Novels →
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
              gap: '14px'
            }}>
              {relatedNovels.map((rel) => {
                const relSlug = rel.slug || rel._id;
                return (
                  <Link
                    key={rel._id}
                    href={`/novel/${relSlug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      <img
                        src={rel.cover_image || '/images/logo-wordmark.png'}
                        alt={`${rel.title} Cover`}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <h3 style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4',
                        marginBottom: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {rel.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>{rel.genres?.[0] || 'Novel'}</span>
                        <span>★ {rel.rating ? rel.rating.toFixed(1) : '4.8'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  padding: '6px 12px',
  borderRadius: '100px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const tagStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  padding: '6px 14px',
  borderRadius: '100px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  background: 'var(--bg-card)',
  display: 'inline-block'
};
