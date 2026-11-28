import { Metadata } from 'next';
import Link from 'next/link';
import { fetchAllNovels } from '@/utils/ssrApi';

interface PageProps {
  params: Promise<{ genre: string }>;
}

function formatGenreName(slug: string): string {
  if (!slug) return 'Web';
  return decodeURIComponent(slug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre } = await params;
  const cleanGenre = formatGenreName(genre);

  const titleStr = `Best ${cleanGenre} Web Novels - Read Online Free | SegyeNovels`;
  const descStr = `Discover and read top translated ${cleanGenre} Korean web novels online for free on SegyeNovels. Follow daily chapter updates, ratings, and reader reviews.`;

  return {
    title: titleStr,
    description: descStr,
    alternates: {
      canonical: `https://www.segyenovels.space/genres/${encodeURIComponent(genre.toLowerCase())}`,
    },
    openGraph: {
      title: titleStr,
      description: descStr,
      url: `https://www.segyenovels.space/genres/${encodeURIComponent(genre.toLowerCase())}`,
      type: 'website',
      siteName: 'SegyeNovels',
      images: [
        {
          url: '/images/logo-wordmark.png',
          width: 1200,
          height: 630,
          alt: `${cleanGenre} Web Novels`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleStr,
      description: descStr,
      images: ['/images/logo-wordmark.png'],
    },
  };
}

export default async function GenreCategoryPage({ params }: PageProps) {
  const { genre } = await params;
  const cleanGenre = formatGenreName(genre);
  const normalizedSlug = decodeURIComponent(genre).toLowerCase().replace(/[\s-]+/g, '');

  const allNovels = await fetchAllNovels();

  // Match novels by normalized genre name
  const novels = allNovels.filter(n => 
    n.genres?.some(g => g.toLowerCase().replace(/[\s-]+/g, '') === normalizedSlug)
  );

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
        "name": "Genres",
        "item": "https://www.segyenovels.space/genres"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${cleanGenre} Novels`,
        "item": `https://www.segyenovels.space/genres/${encodeURIComponent(genre.toLowerCase())}`
      }
    ]
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', paddingBottom: '80px' }}>
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: 0, gap: '8px' }}>
            <li>
              <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
            </li>
            <li aria-hidden="true">&gt;</li>
            <li>
              <Link href="/genres" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Genres</Link>
            </li>
            <li aria-hidden="true">&gt;</li>
            <li style={{ color: 'var(--text-primary)', fontWeight: '600' }} aria-current="page">
              {cleanGenre}
            </li>
          </ol>
        </nav>

        {/* Category Header */}
        <header style={{ marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '100px', padding: '4px 14px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px' }}>
            <span>CATEGORY</span>
            <span>•</span>
            <span>{novels.length} {novels.length === 1 ? 'Novel' : 'Novels'} Available</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {cleanGenre} Web Novels
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '800px' }}>
            Explore our curated collection of translated <strong>{cleanGenre}</strong> Korean web novels and light novels. Read the latest serialized chapters online with free chapters and daily updates on SegyeNovels.
          </p>
        </header>

        {/* Novels Grid */}
        {novels.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '18px',
            rowGap: '26px'
          }}>
            {novels.map((novel) => {
              const novelSlug = novel.slug || novel._id;
              const isCompleted = (novel.publishing_status || 'completed').toLowerCase() === 'completed';

              return (
                <Link
                  key={novel._id}
                  href={`/novel/${novelSlug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}>
                    {/* Cover Container */}
                    <div style={{
                      aspectRatio: '2/3',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <img
                        src={novel.cover_image || '/images/logo-wordmark.png'}
                        alt={`${novel.title} Cover`}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: isCompleted ? '#0f766e' : '#047857',
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(8px)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {isCompleted ? 'Completed' : 'Ongoing'}
                      </span>
                    </div>

                    {/* Novel Details */}
                    <div>
                      <h2 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        lineHeight: '1.35',
                        marginBottom: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {novel.title}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>{novel.author || 'Korean Author'}</span>
                        <span>★ {novel.rating ? novel.rating.toFixed(1) : '4.8'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
              No novels found in {cleanGenre} yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Check out other popular genres on SegyeNovels:
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Regression', 'Romance', 'Fantasy', 'Action', 'Reincarnation'].map(g => (
                <Link
                  key={g}
                  href={`/genres/${g.toLowerCase()}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  {g} Novels
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
