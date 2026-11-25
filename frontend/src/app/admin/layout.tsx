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
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
        Loading Admin Panel...
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
    <div className="min-h-screen bg-[#f8fafc] text-[#000000] flex flex-col lg:flex-row">
      
      {/* MOBILE TOP HEADER (Visible only on < lg) */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2 no-underline text-[#000000]">
            <span className="text-xl">🛡️</span>
            <div>
              <span className="font-extrabold text-base tracking-tight block leading-tight">Segye Admin</span>
              <span className="text-[10px] font-bold text-slate-500 block leading-none">Mobile Control Hub</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold text-[#000000] bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg no-underline flex items-center gap-1 transition-colors"
            >
              <span>🏠</span> <span className="hidden sm:inline">Site</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle admin navigation"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000000] border border-slate-300 font-bold flex items-center justify-center transition-colors"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* HORIZONTAL QUICK SCROLL TABS (Always visible on mobile) */}
        <div className="overflow-x-auto no-scrollbar flex items-center gap-2 px-3 pb-2.5 pt-1 border-t border-slate-100">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all no-underline ${
                  isActive
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'bg-slate-100 text-[#000000] hover:bg-slate-200 border border-slate-200'
                }`}
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
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-[280px] bg-white h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <span className="font-black text-lg text-[#000000]">Segye Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-black font-bold p-1 text-lg"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-extrabold text-sm transition-all no-underline ${
                      isActive
                        ? 'bg-[#6366f1] text-white shadow-md'
                        : 'text-[#000000] hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 mt-auto">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000000] font-extrabold text-sm no-underline transition-colors"
              >
                <span>🏠</span> Return to Live Site
              </Link>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* DESKTOP SIDEBAR (Visible on lg and larger) */}
      <aside className="hidden lg:flex w-[260px] xl:w-[280px] bg-white border-r border-slate-200 p-6 flex-col sticky top-0 h-screen box-border shrink-0">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h2 className="text-xl font-black text-[#000000] m-0 tracking-tight">
              Segye Admin
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-bold">
            Control Center & Content Hub
          </p>
        </div>

        <nav className="grid gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline font-extrabold text-sm transition-all ${
                  isActive
                    ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-500/20'
                    : 'text-[#000000] hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-5 px-2 border-t border-slate-200">
          <Link
            href="/"
            className="text-[#000000] font-extrabold no-underline text-sm flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <span>🏠</span> Back to Live Site
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (Responsive padding & overflow) */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto bg-[#f8fafc] text-[#000000] min-w-0">
        {children}
      </main>
    </div>
  );
}
