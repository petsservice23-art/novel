'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on chapter reading pages to allow distraction-free reading
  if (pathname.includes('/chapter/')) {
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      href: '/',
      active: pathname === '/',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: 'Browse',
      href: '/browse',
      active: pathname.startsWith('/browse'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
        </svg>
      ),
    },
    {
      name: 'Library',
      href: '/library',
      active: pathname === '/library',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      ),
    },
    {
      name: 'Get coins',
      href: '/coins',
      active: pathname === '/coins',
      isCoins: true,
      icon: (
        <div style={{ position: 'relative' }}>
          <span style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontWeight: '900',
            fontSize: '13px',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
          }}>©</span>
        </div>
      ),
    },
    {
      name: user ? 'Profile' : 'Sign In',
      href: user ? '/profile' : '/login',
      active: pathname === '/profile' || pathname === '/login',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="mobile-only" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '62px',
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 999,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            textDecoration: 'none',
            flex: 1,
            height: '100%',
            color: item.active ? 'var(--accent)' : 'var(--text-muted)',
            transition: 'color 0.15s ease'
          }}
        >
          {item.icon}
          <span style={{
            fontSize: '11px',
            fontWeight: item.active ? '700' : '500',
            letterSpacing: '-0.01em'
          }}>
            {item.name}
          </span>
        </Link>
      ))}
    </nav>
  );
}
