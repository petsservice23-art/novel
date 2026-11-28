'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync theme on mount & listen to changes
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'dark';
    setTheme(saved);
    applyTheme(saved);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = localStorage.getItem('theme');
      if (current === 'system') applyTheme('system');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    let resolved = t;
    if (t === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router]);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.2s, border-color 0.2s',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Left Side: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}>
            <img 
              src="/images/logo-symbol.png" 
              alt="SegyeNovels Icon" 
              style={{ 
                height: '38px', 
                width: '38px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(182, 154, 207, 0.35))'
              }} 
            />
            <img 
              src="/images/logo-wordmark.png" 
              alt="SegyeNovels" 
              className="brand-wordmark hide-on-mobile"
              style={{ 
                height: '32px', 
                width: 'auto', 
                objectFit: 'contain',
              }} 
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="desktop-only" style={{ alignItems: 'center', gap: '4px' }}>
            <NavLink href="/browse" label="Browse" />
            <NavLink href="/genres" label="Genres" />
            <NavLink href="/coins" label="Coins" />
            {user?.role === 'admin' && <NavLink href="/admin/dashboard" label="Admin" highlight />}
          </div>
        </div>

        {/* Right Side: Search, Theme Toggle, Profile / Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Desktop Search Bar */}
          <Link href="/search" className="desktop-only" style={{
            alignItems: 'center',
            gap: '10px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--border)',
            borderRadius: '100px',
            padding: '7px 16px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '13px',
            minWidth: '180px',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ flex: 1 }}>Search novels...</span>
            <kbd style={{
              fontSize: '10px',
              fontWeight: '700',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '1px 5px',
              color: 'var(--text-muted)',
              fontFamily: 'inherit',
              letterSpacing: '0.04em'
            }}>Ctrl K</kbd>
          </Link>

          {/* Mobile Search Icon Button */}
          <Link href="/search" className="mobile-only" style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            border: '1px solid var(--border)'
          }}
            aria-label="Search novels"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          {/* Quick Theme Toggle Button (Light/Dark quick switch) */}
          <button
            onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-soft)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            {theme === 'dark' ? (
              // Sun Icon
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              // Moon Icon
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>

          {user ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              {/* Profile Pill Trigger Button */}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: profileOpen ? 'var(--accent-soft)' : 'transparent',
                  border: '1px solid ' + (profileOpen ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: '100px',
                  padding: '4px 10px 4px 4px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background 0.2s, border-color 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={e => {
                  if (!profileOpen) e.currentTarget.style.background = 'var(--accent-soft)';
                }}
                onMouseLeave={e => {
                  if (!profileOpen) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {getInitials(user.username)}
                </div>
                <span className="hidden sm:inline" style={{ fontSize: '13px', fontWeight: '600', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.username}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Profile Dropdown Container */}
              {profileOpen && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '260px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  padding: '8px',
                  zIndex: 200,
                  animation: 'fadeIn 0.15s ease-out',
                }}>
                  {/* User Profile Header */}
                  <div style={{ padding: '12px 14px 14px', borderBottom: '1px solid var(--border)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {user.username}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {user.email}
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: 'var(--gold)' }}>
                      <span>{user.coins || 0}</span>
                      <span style={{ fontWeight: '800' }}>©</span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {user?.role === 'admin' && (
                      <MenuItem 
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        } 
                        label="Admin Dashboard" 
                        href="/admin/dashboard" 
                        highlight
                        onClick={() => setProfileOpen(false)} 
                      />
                    )}

                    <MenuItem 
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                      } 
                      label="Dashboard" 
                      href="/profile" 
                      onClick={() => setProfileOpen(false)} 
                    />
                    
                    <MenuItem 
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                      } 
                      label="Settings" 
                      href="/profile?tab=settings" 
                      onClick={() => setProfileOpen(false)} 
                    />

                    <MenuItem 
                      icon={
                        <span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '16px', lineHeight: 1 }}>©</span>
                      } 
                      label="Buy Coins" 
                      href="/coins" 
                      onClick={() => setProfileOpen(false)} 
                    />

                    <MenuItem 
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                        </svg>
                      } 
                      label="My Library" 
                      href="/library" 
                      onClick={() => setProfileOpen(false)} 
                    />
                  </div>

                  {/* Fully Functional Theme Selector Section in Profile Dropdown */}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', padding: '4px 14px 6px', letterSpacing: '0.05em' }}>
                      THEME
                    </div>
                    <ThemeOption label="Light Theme" value="light" active={theme === 'light'} onClick={() => handleThemeChange('light')} />
                    <ThemeOption label="Dark Theme" value="dark" active={theme === 'dark'} onClick={() => handleThemeChange('dark')} />
                    <ThemeOption label="System Auto" value="system" active={theme === 'system'} onClick={() => handleThemeChange('system')} />
                  </div>

                  {/* Sign Out */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--red)',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href="/login" style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'color 0.15s'
              }}>Sign In</Link>

              <Link href="/register" style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                padding: '7px 16px',
                borderRadius: '100px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'opacity 0.15s, transform 0.15s'
              }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label, highlight }: { href: string; label: string; highlight?: boolean }) {
  return (
    <Link href={href} style={{
      color: highlight ? 'var(--accent)' : 'var(--text-secondary)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: highlight ? '700' : '500',
      padding: '6px 12px',
      borderRadius: '6px',
      transition: 'color 0.15s, background-color 0.15s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.color = 'var(--text-primary)';
      e.currentTarget.style.background = 'var(--accent-soft)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.color = highlight ? 'var(--accent)' : 'var(--text-secondary)';
      e.currentTarget.style.background = 'transparent';
    }}
    >
      {label}
    </Link>
  );
}

function MenuItem({ icon, label, href, onClick, highlight }: { icon: React.ReactNode; label: string; href: string; onClick: () => void; highlight?: boolean }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '8px',
      color: highlight ? 'var(--accent)' : 'var(--text-primary)',
      background: highlight ? 'var(--accent-soft)' : 'transparent',
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: highlight ? '700' : '500',
      transition: 'background 0.15s, color 0.15s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'var(--accent-soft)';
      e.currentTarget.style.color = 'var(--accent)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = highlight ? 'var(--accent-soft)' : 'transparent';
      e.currentTarget.style.color = highlight ? 'var(--accent)' : 'var(--text-primary)';
    }}
    >
      <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {highlight && (
        <span style={{ fontSize: '10px', fontWeight: '800', background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>
          ADMIN
        </span>
      )}
    </Link>
  );
}

function ThemeOption({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderRadius: '8px',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s'
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--accent-soft)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span>{label}</span>
      {active && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </div>
  );
}
