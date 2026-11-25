'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#000000' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', 
        background: '#ffffff', 
        borderRight: '1.5px solid #e2e8f0',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: '36px', padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
              Segye Admin
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontWeight: '700' }}>
            Control Center & Content Hub
          </p>
        </div>

        <nav style={{ display: 'grid', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#000000',
                  background: isActive ? '#6366f1' : 'transparent',
                  fontWeight: '800',
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px 12px', borderTop: '1.5px solid #e2e8f0' }}>
          <Link
            href="/"
            style={{
              color: '#000000',
              fontWeight: '800',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#f1f5f9'
            }}
          >
            <span>🏠</span> Back to Live Site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#f8fafc', color: '#000000' }}>
        {children}
      </main>
    </div>
  );
}
