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
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Admin Panel...</div>;
  }

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Manage Novels', href: '/admin/novels', icon: '📚' },
    { name: 'Bulk Importer', href: '/admin/importer', icon: '⚡' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', 
        background: 'var(--bg-secondary)', 
        borderRight: '1px solid var(--border)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ marginBottom: '40px', padding: '0 12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>Admin Panel</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Novelverse Management</p>
        </div>

        <nav style={{ display: 'grid', gap: '8px' }}>
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: pathname === item.href ? '#fff' : 'var(--text-secondary)',
                background: pathname === item.href ? 'var(--accent)' : 'transparent',
                fontWeight: '700',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px 12px', borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏠</span> Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
