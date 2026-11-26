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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex items-center gap-3 font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="animate-spin text-xl">⏳</span>
          <span>Loading platform metrics...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: (stats?.users || 0).toLocaleString(), icon: '👥', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', hint: 'Registered readers' },
    { label: 'Total Novels', value: (stats?.novels || 0).toLocaleString(), icon: '📚', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', hint: 'Published catalog' },
    { label: 'Total Chapters', value: (stats?.chapters || 0).toLocaleString(), icon: '📝', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', hint: 'In database & storage' },
    { label: 'Platform Revenue', value: `$${(stats?.revenue || 0).toLocaleString()}`, icon: '💰', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', hint: 'Lifetime coin sales' },
  ];

  return (
    <div className="w-full transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="mb-6 sm:mb-8 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              Dashboard Overview
            </h1>
            <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Welcome to the SegyeNovels control center. Monitor library size, chapter growth, and reader engagement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Live System
            </span>
          </div>
        </div>
      </header>

      {/* Stat Cards (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[11px] font-bold uppercase tracking-wider truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {card.label}
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.color}35`,
                }}
              >
                {card.icon}
              </div>
            </div>

            <div>
              <h2
                className="text-2xl sm:text-3xl font-black m-0 tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {card.value}
              </h2>
              <p className="text-[11px] font-medium m-0 mt-2 truncate" style={{ color: 'var(--text-muted)' }}>
                {card.hint}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Quick Management Actions
          </h2>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Core Administrative Workflows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/importer"
            className="group p-5 rounded-2xl border no-underline shadow-xs transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
              >
                ⚡
              </div>
              <span className="text-xs font-bold transition-transform group-hover:translate-x-1" style={{ color: 'var(--accent)' }}>
                Open →
              </span>
            </div>
            <h3 className="text-base font-extrabold m-0 mb-1 transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>
              EPUB / PDF Importer
            </h3>
            <p className="text-xs sm:text-sm m-0 leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
              Auto-parse and upload entire books with cover extraction and 50 free chapters rule.
            </p>
          </Link>

          <Link
            href="/admin/novels"
            className="group p-5 rounded-2xl border no-underline shadow-xs transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
              >
                📚
              </div>
              <span className="text-xs font-bold transition-transform group-hover:translate-x-1" style={{ color: 'var(--accent)' }}>
                Manage →
              </span>
            </div>
            <h3 className="text-base font-extrabold m-0 mb-1 transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>
              Manage Novels & Chapters
            </h3>
            <p className="text-xs sm:text-sm m-0 leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
              Hide/unhide novels, edit metadata, delete chapters or novels, and set locking thresholds.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="group p-5 rounded-2xl border no-underline shadow-xs transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
              >
                👥
              </div>
              <span className="text-xs font-bold transition-transform group-hover:translate-x-1" style={{ color: 'var(--accent)' }}>
                Directory →
              </span>
            </div>
            <h3 className="text-base font-extrabold m-0 mb-1 transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>
              User Directory & Coins
            </h3>
            <p className="text-xs sm:text-sm m-0 leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
              Inspect user balances, grant promotional coins, or adjust roles and permissions.
            </p>
          </Link>
        </div>
      </section>

      {/* System Status */}
      <section>
        <div
          className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </div>
            <div>
              <strong className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                Database & Cloud Storage Operational
              </strong>
              <p className="text-xs m-0 mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Connected to MongoDB Atlas cluster and Cloudflare R2 object storage endpoints.
              </p>
            </div>
          </div>
          <span
            className="text-xs font-black px-3 py-1 rounded-xl border shrink-0 tracking-wide uppercase"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            ONLINE
          </span>
        </div>
      </section>
    </div>
  );
}
