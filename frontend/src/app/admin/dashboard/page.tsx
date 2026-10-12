'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Stats {
  users: number;
  novels: number;
  chapters: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Loading statistics...</div>;

  const statCards = [
    { label: 'Total Users', value: stats?.users, icon: '👥', color: '#3b82f6' },
    { label: 'Total Novels', value: stats?.novels, icon: '📚', color: '#10b981' },
    { label: 'Total Chapters', value: stats?.chapters, icon: '📝', color: '#f59e0b' },
    { label: 'Mock Revenue', value: `$${stats?.revenue}`, icon: '💰', color: '#ef4444' },
  ];

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to the control center.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {statCards.map((card) => (
          <div key={card.label} style={{
            background: 'var(--bg-secondary)',
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              background: `${card.color}20`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>{card.label}</p>
              <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginTop: '4px' }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Mockup */}
      <section style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '24px' }}>Recent Activity</h2>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Activity tracking will appear here.</p>
        </div>
      </section>
    </div>
  );
}
