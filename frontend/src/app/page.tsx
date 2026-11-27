import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchAllNovels, NovelItem } from '@/utils/ssrApi';
import { formatTimeAgo } from '@/utils/timeAgo';
import HeroCarousel from '@/components/HeroCarousel';

export const metadata: Metadata = {
  title: "SegyeNovels — Read Web Novels Online | Free Daily Updates",
  description: "Discover and read thousands of Korean web novels, fantasy, romance, regression, and martial arts serials online for free on SegyeNovels. Free daily chapters with high quality translations.",
  alternates: {
    canonical: "https://www.segyenovels.space",
  },
};

export const revalidate = 120; // ISR: revalidate every 2 minutes

const getCleanAuthor = (author?: string) => {
  if (!author) return 'Korean Author';
  const lower = author.toLowerCase();
  if (lower.includes('novelverse') || lower.includes('segyenovels') || lower.includes('admin')) {
    return 'Korean Author';
  }
  return author;
};

// Novel Card component - Pure SSR HTML for 100% crawlability
const NovelCard = ({ novel, badge }: { novel: NovelItem; badge?: string }) => {
  const isCompleted = (novel.publishing_status || 'completed').toLowerCase() === 'completed';
  const authorName = getCleanAuthor(novel.author);

  const displayDate = (novel.updatedAt && novel.createdAt && new Date(novel.updatedAt).getTime() < new Date(novel.createdAt).getTime())
    ? novel.createdAt
    : (novel.updatedAt || novel.createdAt);

  return (
    <Link href={`/novel/${novel._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          cursor: 'pointer'
        }}
      >
        {/* Cover Image Container */}
        <div style={{ 
          aspectRatio: '2/3', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <img 
            src={novel.cover_image} 
            alt={`${novel.title} by ${authorName}`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />

          {/* Frosted Transparent Status Tag in Top-Left */}
          <span style={{ 
            position: 'absolute',
            top: '6px',
            left: '6px',
            fontSize: '9px', 
            fontWeight: '700', 
            color: isCompleted ? '#0f766e' : '#047857',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: isCompleted ? '1px solid rgba(15, 118, 110, 0.3)' : '1px solid rgba(4, 120, 87, 0.3)',
            padding: '2px 7px',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10
          }}>
            {isCompleted ? 'Completed' : 'Ongoing'}
          </span>

          {badge && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              fontSize: '9px',
              fontWeight: '800',
              color: '#fff',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              padding: '2px 6px',
              borderRadius: '4px',
              zIndex: 10
            }}>
              {badge}
            </span>
          )}
        </div>

        {/* Text Container: Semantically indexed H3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            lineHeight: '1.3',
            minHeight: '34px'
          }}>
            {novel.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {authorName}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '500' }}>
              {novel.total_chapters || 0} chapters · {formatTimeAgo(displayDate)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default async function Home() {
  const novels = await fetchAllNovels();

  // Data slices for sections
  const newArrivals = novels.slice(0, 14);
  const recentlyUpdated = [...novels].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()).slice(0, 14);
  const topRanked = [...novels].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 14);

  // Schema.org ItemList for Google rich results
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Top Web Novels on SegyeNovels",
    "description": "Popular Korean translated web novels, fantasy and romance serials.",
    "itemListElement": topRanked.map((n, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": n.title,
      "url": `https://www.segyenovels.space/novel/${n._id}`,
      "image": n.cover_image
    }))
  };

  return (
    <div style={{ 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      minHeight: '100vh', 
      paddingBottom: '80px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* 1. HERO CAROUSEL */}
      <HeroCarousel novels={novels.slice(0, 15)} />

      {/* 2. NOVEL GRID SECTIONS (Raw SSR HTML for Googlebot) */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>

        {/* SECTION A: NEW ARRIVALS */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                New Arrivals
              </h2>
            </div>
            <Link href="/browse?sort=newest" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View all</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {newArrivals.map((novel, idx) => (
              <NovelCard key={novel._id} novel={novel} badge={idx < 2 ? 'NEW' : undefined} />
            ))}
          </div>
        </section>

        {/* SECTION B: RECENTLY UPDATED */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Recently Updated
              </h2>
            </div>
            <Link href="/browse?sort=updated" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View all</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {recentlyUpdated.map((novel) => (
              <NovelCard key={novel._id} novel={novel} />
            ))}
          </div>
        </section>

        {/* SECTION C: TOP RANKED NOVELS */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Top Ranked Novels
              </h2>
            </div>
            <Link href="/browse?sort=popular" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>View all</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '14px' 
          }}>
            {topRanked.map((novel, idx) => (
              <NovelCard key={novel._id} novel={novel} badge={`#${idx + 1}`} />
            ))}
          </div>
        </section>

        {/* SECTION D: SEO INTERNAL LINK DIRECTORY (Helps Google discover all genres & stories) */}
        <section style={{
          marginTop: '64px',
          padding: '32px 24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Read Popular Web Novels & Light Novels Online
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
            SegyeNovels is a premier digital reading platform for translated Korean web novels, fantasy epics, romance novels, and reincarnation stories. Discover ongoing serialized novels updated daily with the first 50 chapters free for all readers.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {['Romance', 'Fantasy', 'Action', 'Drama', 'Regression', 'Reincarnation', 'Comedy', 'Martial Arts', 'Sci-Fi'].map((genre) => (
              <Link
                key={genre}
                href={`/browse?genre=${encodeURIComponent(genre)}`}
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none'
                }}
              >
                {genre} Novels
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {novels.slice(0, 18).map(n => (
              <Link
                key={n._id}
                href={`/novel/${n._id}`}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
              >
                {n.title}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
