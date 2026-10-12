'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AuthorDashboard() {
  const [novels, setNovels] = useState([
    { id: 1, title: "The Alchemist's Secret", views: "45.2k", earnings: "$120.50", status: "Approved" },
    { id: 2, title: "Rebirth of the Sword King", views: "12.1k", earnings: "$45.00", status: "Pending" }
  ]);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Author Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Author! Here's how your stories are performing.</p>
        </div>
        <button style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '700',
          border: 'none',
          cursor: 'pointer'
        }}>+ Write New Story</button>
      </header>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '60px'
      }}>
        {[
          { label: 'Total Views', value: '57.3k', icon: '👁️', trend: '+12% this week' },
          { label: 'Total Earnings', value: '$165.50', icon: '💰', trend: '+$24.10 today' },
          { label: 'Followers', value: '1,204', icon: '👥', trend: '+5 new' },
          { label: 'Rank', value: '#402', icon: '🏆', trend: '↑ 15 positions' }
        ].map((stat, idx) => (
          <div key={idx} style={{ 
            background: 'var(--bg-secondary)', 
            padding: '24px', 
            borderRadius: '20px', 
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: '700' }}>{stat.trend}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>{stat.label}</p>
            <h3 style={{ fontSize: '28px', fontWeight: '800' }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* My Novels Table */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '24px', 
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>My Novels</h2>
          <Link href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>View all insights</Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Title</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Views</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Earnings</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {novels.map(novel => (
                <tr key={novel.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '20px 24px', fontWeight: '700' }}>{novel.title}</td>
                  <td style={{ padding: '20px 24px' }}>{novel.views}</td>
                  <td style={{ padding: '20px 24px', color: 'var(--green)', fontWeight: '700' }}>{novel.earnings}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      background: novel.status === 'Approved' ? 'rgba(76, 175, 125, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                      color: novel.status === 'Approved' ? 'var(--green)' : '#ffc107',
                      padding: '4px 10px',
                      borderRadius: '20px'
                    }}>{novel.status}</span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Edit</button>
                      <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Chapters</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
