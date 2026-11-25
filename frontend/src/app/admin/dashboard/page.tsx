'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Stats {
  users: number;
  novels: number;
  chapters: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/stats`);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [API_URL]);

  if (loading) return <div style={{ color: '#000000', fontWeight: '800' }}>Loading statistics...</div>;

  const statCards = [
    { label: 'Total Users', value: stats?.users || 0, icon: '👥', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Novels', value: stats?.novels || 0, icon: '📚', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Total Chapters', value: stats?.chapters || 0, icon: '📝', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Platform Revenue', value: `$${stats?.revenue || 0}`, icon: '💰', color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <div style={{ color: '#000000', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#000000', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: '#374151', fontSize: '15px' }}>
          Welcome to the SegyeNovels control center. Monitor library size, chapter growth, and reader engagement.
        </p>
      </header>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {statCards.map((card) => (
          <div key={card.label} style={{
            background: '#ffffff',
            padding: '28px',
            borderRadius: '20px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '14px', 
              background: card.bg,
              border: `1.5px solid ${card.color}30`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ color: '#475569', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {card.label}
              </p>
              <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#000000', margin: '4px 0 0' }}>
                {card.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#000000', marginBottom: '16px' }}>
          Quick Management Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Link
            href="/admin/importer"
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#000000', margin: '0 0 6px' }}>
              EPUB / PDF Importer
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Auto-parse and upload entire books with 50 free chapters.
            </p>
          </Link>

          <Link
            href="/admin/novels"
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#000000', margin: '0 0 6px' }}>
              Manage Novels & Chapters
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Hide/unhide novels, edit metadata, delete, or change locking rules.
            </p>
          </Link>

          <Link
            href="/admin/users"
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#000000', margin: '0 0 6px' }}>
              User Directory & Coins
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Inspect user balances, grant coins, or adjust account roles.
            </p>
          </Link>
        </div>
      </section>

      {/* System Status */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#000000', marginBottom: '16px' }}>
          Platform Status
        </h2>
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <strong style={{ color: '#000000', fontSize: '15px' }}>Database & Storage Operational</strong>
            </div>
            <p style={{ color: '#475569', fontSize: '13px', margin: '4px 0 0' }}>
              Connected to MongoDB Atlas and Cloudflare R2 object storage.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', background: '#ecfdf5', padding: '6px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            ONLINE
          </span>
        </div>
      </section>
    </div>
  );
}
