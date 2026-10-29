'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Left Side: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{
            fontSize: '22px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: '14px',
              fontWeight: '900'
            }}>◎</span>
            Novelverse
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NavLink href="/browse" label="Browse" />
            <NavLink href="/genres" label="Genres" />
            <NavLink href="/coins" label="Coins" />
            {user && <NavLink href="/library" label="Library" />}
            {user?.role === 'admin' && <NavLink href="/admin/dashboard" label="Admin" highlight />}
          </div>
        </div>

        {/* Right Side: Search, Coins, Theme, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search Bar */}
          <Link href="/search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border)',
            borderRadius: '100px',
            padding: '7px 16px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '13px',
            minWidth: '200px',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ flex: 1 }}>Search novels...</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}>Ctrl K</span>
          </Link>

          {/* Get Coins Button */}
          <Link href="/coins" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#eab308',
            color: '#000',
            padding: '6px 14px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            textDecoration: 'none',
            transition: 'transform 0.15s, opacity 0.15s',
            boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)'
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span style={{ fontWeight: '900', fontSize: '15px', lineHeight: 1 }}>©</span>
            <span>Get coins</span>
          </Link>

          {user ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              {/* Profile Pill Trigger Button */}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: profileOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: '1px solid ' + (profileOpen ? 'var(--text-muted)' : 'transparent'),
                  borderRadius: '100px',
                  padding: '4px 10px 4px 4px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background 0.2s, border-color 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={e => {
                  if (!profileOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={e => {
                  if (!profileOpen) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '0.5px'
                }}>
                  {getInitials(user.username)}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.username}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Profile Drawer / Dropdown Menu (Screenshot Accurate) */}
              {profileOpen && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '260px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  padding: '8px',
                  zIndex: 200,
                  animation: 'fadeIn 0.15s ease-out',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {/* User Profile Header */}
                  <div style={{ padding: '12px 14px 14px', borderBottom: '1px solid #27272a', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fafafa', marginBottom: '2px' }}>
                        {user.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {user.email}
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                      <span>{user.coins || 0}</span>
                      <span style={{ fontWeight: '800' }}>©</span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                        <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '16px', lineHeight: 1 }}>©</span>
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

                  {/* Theme Selector Section */}
                  <div style={{ borderTop: '1px solid #27272a', margin: '8px 0', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#71717a', padding: '4px 14px 6px', letterSpacing: '0.05em' }}>
                      THEME
                    </div>
                    <ThemeOption label="Light" value="light" active={theme === 'light'} onClick={() => setTheme('light')} />
                    <ThemeOption label="Dark" value="dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
                    <ThemeOption label="System" value="system" active={theme === 'system'} onClick={() => setTheme('system')} />
                  </div>

                  {/* Sign Out */}
                  <div style={{ borderTop: '1px solid #27272a', paddingTop: '6px' }}>
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
                        color: '#ef4444',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/login" style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 14px',
              }}>Sign In</Link>

              <Link href="/register" style={{
                background: 'var(--accent)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                padding: '8px 18px',
                borderRadius: '100px',
                boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.3)',
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
      transition: 'color 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.color = highlight ? 'var(--accent)' : 'var(--text-primary)')}
    onMouseLeave={e => (e.currentTarget.style.color = highlight ? 'var(--accent)' : 'var(--text-secondary)')}
    >
      {label}
    </Link>
  );
}

function MenuItem({ icon, label, href, onClick }: { icon: React.ReactNode; label: string; href: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '8px',
      color: '#d4d4d8',
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'background 0.15s, color 0.15s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      e.currentTarget.style.color = '#fff';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = '#d4d4d8';
    }}
    >
      <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span>{label}</span>
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
        color: active ? '#fff' : '#a1a1aa',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'background 0.15s'
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span>{label}</span>
      {active && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
      )}
    </div>
  );
}
