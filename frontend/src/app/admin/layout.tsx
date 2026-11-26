'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-bold text-base"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-3">
          <span className="animate-spin text-xl">⏳</span>
          <span>Loading Admin Panel...</span>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', shortName: 'Overview', href: '/admin/dashboard', icon: '📊' },
    { name: 'Manage Novels', shortName: 'Novels', href: '/admin/novels', icon: '📚' },
    { name: 'EPUB / PDF Importer', shortName: 'Importer', href: '/admin/importer', icon: '⚡' },
    { name: 'Users', shortName: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Support Inbox', shortName: 'Support', href: '/admin/support', icon: '💬' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* MOBILE TOP HEADER (Visible only on < lg) */}
      <div
        className="lg:hidden sticky top-0 z-40 border-b shadow-xs transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin drawer navigation"
              className="p-2 rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              ☰
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2 no-underline" style={{ color: 'var(--text-primary)' }}>
              <span className="font-black text-base tracking-tight block">Segye Admin</span>
            </Link>
          </div>

          <Link
            href="/"
            className="text-xs font-bold px-3 py-1.5 rounded-lg no-underline flex items-center gap-1.5 transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <span>🏠</span> <span>Live Site</span>
          </Link>
        </div>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div
            className="w-[280px] h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🛡️</span>
                <div>
                  <span className="font-black text-lg block leading-tight">Segye Admin</span>
                  <span className="text-[11px] font-semibold block leading-none" style={{ color: 'var(--text-muted)' }}>
                    Navigation Drawer
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="font-bold p-1 text-lg cursor-pointer rounded-lg hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all no-underline"
                    style={
                      isActive
                        ? {
                            background: 'var(--accent-gradient)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 14px rgba(142, 107, 175, 0.35)',
                          }
                        : {
                            color: 'var(--text-secondary)',
                            backgroundColor: 'transparent',
                          }
                    }
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t mt-auto" style={{ borderColor: 'var(--border)' }}>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-sm no-underline transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <span>🏠</span> Return to Live Site
              </Link>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on mobile < lg) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all no-underline flex-1 text-center"
              style={
                isActive
                  ? {
                      color: 'var(--accent)',
                    }
                  : {
                      color: 'var(--text-muted)',
                    }
              }
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base mb-0.5 transition-all ${
                  isActive ? 'shadow-xs scale-105' : ''
                }`}
                style={
                  isActive
                    ? {
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent)',
                      }
                    : {
                        background: 'transparent',
                      }
                }
              >
                {item.icon}
              </div>
              <span
                className="text-[10px] font-extrabold tracking-tight truncate leading-none"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {item.shortName}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* DESKTOP SIDEBAR (Visible on lg and larger) */}
      <aside
        className="hidden lg:flex w-[250px] xl:w-[270px] p-5 flex-col sticky top-16 h-[calc(100vh-4rem)] box-border shrink-0 border-r transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Brand Header */}
        <div className="mb-6 px-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}
            >
              🛡️
            </div>
            <div>
              <h2 className="text-base font-black m-0 tracking-tight leading-tight">
                Segye Admin
              </h2>
              <p className="text-[11px] font-semibold m-0 leading-tight" style={{ color: 'var(--text-muted)' }}>
                Control Center Hub
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline font-bold text-sm transition-all"
                style={
                  isActive
                    ? {
                        background: 'var(--accent-gradient)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 14px rgba(142, 107, 175, 0.35)',
                      }
                    : {
                        color: 'var(--text-secondary)',
                        backgroundColor: 'transparent',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Link to Site */}
        <div className="pt-3 border-t mt-auto" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/"
            className="font-bold no-underline text-xs flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <span>🏠</span> Back to Live Site
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (with bottom padding for mobile bottom bar) */}
      <main
        className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-8 overflow-y-auto min-w-0 transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
