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
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Manage Novels', href: '/admin/novels', icon: '📚' },
    { name: 'EPUB / PDF Importer', href: '/admin/importer', icon: '⚡' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Support Inbox', href: '/admin/support', icon: '💬' },
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
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 no-underline" style={{ color: 'var(--text-primary)' }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-xs"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}
            >
              🛡️
            </div>
            <div>
              <span className="font-black text-base tracking-tight block leading-tight">Segye Admin</span>
              <span className="text-[11px] font-semibold block leading-none" style={{ color: 'var(--text-muted)' }}>
                Control Center
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-lg no-underline flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <span>🏠</span> <span className="hidden sm:inline">Site</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle admin navigation"
              className="p-2 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* HORIZONTAL QUICK SCROLL TABS (Always visible on mobile) */}
        <div
          className="overflow-x-auto no-scrollbar flex items-center gap-2 px-3 pb-2.5 pt-1 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all no-underline ${
                  isActive ? 'shadow-sm' : ''
                }`}
                style={
                  isActive
                    ? {
                        background: 'var(--accent-gradient)',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 10px rgba(142, 107, 175, 0.35)',
                      }
                    : {
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }
                }
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
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
                <span className="font-black text-lg">Segye Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="font-bold p-1 text-lg cursor-pointer"
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

      {/* DESKTOP SIDEBAR (Visible on lg and larger) */}
      <aside
        className="hidden lg:flex w-[260px] xl:w-[280px] p-6 flex-col sticky top-0 h-screen box-border shrink-0 border-r transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Brand Header */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}
            >
              🛡️
            </div>
            <div>
              <h2 className="text-lg font-black m-0 tracking-tight leading-tight">
                Segye Admin
              </h2>
              <p className="text-[11px] font-semibold m-0 leading-tight" style={{ color: 'var(--text-muted)' }}>
                Content & Systems Hub
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline font-bold text-sm transition-all"
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
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Link to Site */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
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

      {/* MAIN CONTENT AREA */}
      <main
        className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {children}
      </main>
    </div>
  );
}
