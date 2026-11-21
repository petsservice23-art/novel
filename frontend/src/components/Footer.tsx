'use client';

import Link from 'next/link';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ 
      background: 'var(--bg-secondary)', 
      borderTop: '1px solid var(--border)', 
      padding: '56px 20px 36px',
      transition: 'background-color 0.2s, border-color 0.2s',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '40px', 
        marginBottom: '48px' 
      }}>
        {/* Brand Column (Left) */}
        <div style={{ maxWidth: '320px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '14px' }}>
            <img 
              src="/images/logo-symbol.png" 
              alt="SegyeNovels Icon" 
              style={{ height: '30px', width: '30px', objectFit: 'contain' }} 
            />
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              SegyeNovels
            </span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.65', fontSize: '13px' }}>
            Read web novels and light novels online. Free chapters, premium content, and a clean reading experience.
          </p>
        </div>

        {/* Column 1: About Us */}
        <div>
          <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '13px', color: 'var(--text-primary)' }}>
            About Us
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/about" style={linkStyle}>About Us</Link>
            <Link href="/support" style={linkStyle}>Support Chat</Link>
          </div>
        </div>

        {/* Column 2: Community */}
        <div>
          <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '13px', color: 'var(--text-primary)' }}>
            Community
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/help" style={linkStyle}>Help Center</Link>
            <Link href="/browse" style={linkStyle}>Community</Link>
          </div>
        </div>

        {/* Column 3: Legal */}
        <div>
          <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '13px', color: 'var(--text-primary)' }}>
            Legal
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/privacy-policy" style={linkStyle}>Privacy Policy</Link>
            <Link href="/terms-of-service" style={linkStyle}>Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Back to Top (Matching Ownverso) */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--text-muted)', 
        fontSize: '12px', 
        borderTop: '1px solid var(--border)', 
        paddingTop: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span>© 2026 SegyeNovels. All rights reserved.</span>
        
        <button 
          onClick={scrollToTop}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <span>↑</span>
          <span>Back to top</span>
        </button>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '13px',
  transition: 'color 0.15s'
};
