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
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 font-bold text-base" style={{ color: 'var(--text-secondary)' }}>
          <span className="animate-spin text-2xl">⏳</span>
          <span>Loading platform metrics...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: (stats?.users || 0).toLocaleString(),
      icon: '👥',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.25)',
      hint: 'Registered readers',
    },
    {
      label: 'Total Novels',
      value: (stats?.novels || 0).toLocaleString(),
      icon: '📚',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      hint: 'Published catalog',
    },
    {
      label: 'Total Chapters',
      value: (stats?.chapters || 0).toLocaleString(),
      icon: '📝',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
      hint: 'In database & storage',
    },
    {
      label: 'Platform Revenue',
      value: `$${(stats?.revenue || 0).toLocaleString()}`,
      icon: '💰',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.12)',
      border: 'rgba(139, 92, 246, 0.25)',
      hint: 'Lifetime coin sales',
    },
  ];

  return (
    <div className="max-w-[1100px] mx-auto w-full space-y-10 transition-colors duration-200">
      {/* Header */}
      <header className="space-y-1.5 pb-2">
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight m-0"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Dashboard Overview
        </h1>
        <p className="text-sm sm:text-base font-medium m-0" style={{ color: 'var(--text-secondary)' }}>
          Welcome to the SegyeNovels control center. Monitor library size, chapter growth, and reader engagement.
        </p>
      </header>

      {/* Spacious 4 Stat Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="p-6 sm:p-7 rounded-2xl border transition-all duration-200 flex items-center gap-5 shadow-xs hover:shadow-md"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs"
                style={{
                  backgroundColor: card.bg,
                  border: `1.5px solid ${card.border}`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-bold uppercase tracking-wider truncate m-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {card.label}
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-black tracking-tight mt-1 mb-0 truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {card.value}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Management Actions Panel */}
      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/admin/importer"
            className="group block p-6 sm:p-7 rounded-2xl border no-underline transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">⚡</div>
            <h3
              className="text-base sm:text-lg font-bold tracking-tight mb-2 group-hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              EPUB / PDF Importer
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
              Auto-parse and upload entire books with automatic cover extraction and 50 free chapters.
            </p>
          </Link>

          <Link
            href="/admin/novels"
            className="group block p-6 sm:p-7 rounded-2xl border no-underline transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">📚</div>
            <h3
              className="text-base sm:text-lg font-bold tracking-tight mb-2 group-hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              Manage Novels & Chapters
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
              Hide/unhide novels, edit metadata, delete individual chapters or full titles, and configure coins.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="group block p-6 sm:p-7 rounded-2xl border no-underline transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">👥</div>
            <h3
              className="text-base sm:text-lg font-bold tracking-tight mb-2 group-hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              User Directory & Coins
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
              Inspect registered reader balances, grant promotional coins, and adjust administrator permissions.
            </p>
          </Link>
        </div>
      </section>

      {/* Platform Status */}
      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
          Platform Status
        </h2>
        <div
          className="p-6 sm:p-7 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0"></span>
              <strong className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Database & Cloud Storage Operational
              </strong>
            </div>
            <p className="text-xs sm:text-sm font-medium m-0 pl-5" style={{ color: 'var(--text-secondary)' }}>
              Connected to MongoDB Atlas cluster and Cloudflare R2 object storage endpoints.
            </p>
          </div>

          <span
            className="self-start sm:self-auto text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.28)',
            }}
          >
            ONLINE
          </span>
        </div>
      </section>
    </div>
  );
}
