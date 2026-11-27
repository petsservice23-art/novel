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
          <a
            href="https://discord.gg/tYpfqW9vj"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: '#5865F2',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'transform 0.15s, opacity 0.15s',
              boxShadow: '0 4px 14px rgba(88, 101, 242, 0.25)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.opacity = '0.92';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.opacity = '1';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join Discord Community
          </a>
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
            <a 
              href="https://discord.gg/tYpfqW9vj" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#5865F2', fontWeight: '600' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Discord Community</span>
            </a>
            <Link href="/help" style={linkStyle}>Help Center</Link>
            <Link href="/browse" style={linkStyle}>Browse Library</Link>
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
