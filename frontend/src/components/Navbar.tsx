'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontSize: '22px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.5px',
        }}>
          Novelverse
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/browse" style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >Browse</Link>

          <Link href="/genres" style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >Genres</Link>

          <Link href="/coins" style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            padding: '6px 12px',
            borderRadius: '6px',
          }}>Coins</Link>

          {user && (
            <Link href="/library" style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '6px 12px',
              borderRadius: '6px',
            }}>Library</Link>
          )}

          {user?.role === 'admin' && (
            <Link href="/admin/dashboard" style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '6px',
            }}>Admin</Link>
          )}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <Link href="/search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '100px',
            padding: '7px 16px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '13px',
            minWidth: '220px',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ flex: 1 }}>Search...</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              background: 'var(--bg-card)',
              padding: '2px 8px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}>Ctrl K</span>
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#FFD700', fontWeight: '700' }}>{user.coins || 0}</span>
                  <span style={{ color: '#FFD700', fontSize: '12px' }}>©</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>{user.unlock_tickets || 0}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>🎟️</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 69, 0, 0.1)', padding: '2px 8px', borderRadius: '100px' }}>
                  <span style={{ color: '#FF4500', fontWeight: '700' }}>{user.reading_streak?.current_streak || 0}</span>
                  <span style={{ color: '#FF4500', fontSize: '12px' }}>🔥</span>
                </div>
                {user.is_vip && (
                  <div style={{ background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>VIP</div>
                )}
              </div>
              
              <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/profile" style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '10px', 
                    background: 'var(--accent)', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: '700', 
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)',
                    cursor: 'pointer'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button onClick={logout} style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >Logout</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/login" style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 16px',
              }}>Sign In</Link>

              <Link href="/register" style={{
                background: 'var(--accent)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                padding: '8px 20px',
                borderRadius: '100px',
                boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.3)',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
