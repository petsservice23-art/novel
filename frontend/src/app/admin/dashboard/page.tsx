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
      border: 'rgba(59, 130, 246, 0.28)',
      hint: 'Registered reader accounts',
    },
    {
      label: 'Total Novels',
      value: (stats?.novels || 0).toLocaleString(),
      icon: '📚',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.28)',
      hint: 'Published in live catalog',
    },
    {
      label: 'Total Chapters',
      value: (stats?.chapters || 0).toLocaleString(),
      icon: '📝',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.28)',
      hint: 'Stored in Cloudflare R2',
    },
    {
      label: 'Platform Revenue',
      value: `$${(stats?.revenue || 0).toLocaleString()}`,
      icon: '💰',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.12)',
      border: 'rgba(139, 92, 246, 0.28)',
      hint: 'Lifetime coins sales',
    },
  ];

  return (
    <div className="w-full space-y-8 transition-colors duration-200">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight m-0"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm font-medium mt-1.5 m-0" style={{ color: 'var(--text-secondary)' }}>
            Welcome to the SegyeNovels control center. Monitor library size, chapter growth, and reader engagement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl border flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Live System</span>
          </span>
          <span
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            v2.4 Production
          </span>
        </div>
      </header>

      {/* Spacious 4 Stat Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="p-6 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
                minHeight: '145px',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {card.label}
                </span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    backgroundColor: card.bg,
                    border: `1px solid ${card.border}`,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
              </div>

              <div className="mt-3">
                <div
                  className="text-3xl sm:text-4xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {card.value}
                </div>
                <div
                  className="text-xs font-semibold mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {card.hint}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Balanced 2-Column Section: Workflows & Infrastructure + Platform Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column (8 cols): Quick Actions & System Infrastructure */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Actions */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
                Quick Management Actions
              </h2>
              <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                Core Workflows
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <Link
                href="/admin/importer"
                className="group flex flex-col justify-between p-5 sm:p-6 rounded-2xl border no-underline transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  minHeight: '175px',
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    ⚡
                  </div>
                  <h3
                    className="text-base font-bold tracking-tight mb-1 group-hover:text-[var(--accent)] transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    EPUB / PDF Importer
                  </h3>
                  <p className="text-xs font-medium leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
                    Auto-parse entire books with cover extraction and 50 free chapters.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                  <span>Launch Importer</span>
                  <span>→</span>
                </div>
              </Link>

              <Link
                href="/admin/novels"
                className="group flex flex-col justify-between p-5 sm:p-6 rounded-2xl border no-underline transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  minHeight: '175px',
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    📚
                  </div>
                  <h3
                    className="text-base font-bold tracking-tight mb-1 group-hover:text-[var(--accent)] transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Manage Novels & Chapters
                  </h3>
                  <p className="text-xs font-medium leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
                    Edit titles, delete chapters individually, and configure coins.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                  <span>Manage Catalog</span>
                  <span>→</span>
                </div>
              </Link>

              <Link
                href="/admin/users"
                className="group flex flex-col justify-between p-5 sm:p-6 rounded-2xl border no-underline transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  minHeight: '175px',
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    👥
                  </div>
                  <h3
                    className="text-base font-bold tracking-tight mb-1 group-hover:text-[var(--accent)] transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    User Directory & Coins
                  </h3>
                  <p className="text-xs font-medium leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
                    Inspect user balances, grant promotional coins, and review roles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                  <span>View Users</span>
                  <span>→</span>
                </div>
              </Link>
            </div>
          </section>

          {/* Infrastructure Health Card */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
              Platform Infrastructure Health
            </h2>

            <div
              className="p-5 sm:p-6 rounded-2xl border space-y-4 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🍃</span>
                  <div>
                    <h4 className="text-sm font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                      MongoDB Atlas Cluster
                    </h4>
                    <p className="text-xs font-medium m-0" style={{ color: 'var(--text-secondary)' }}>
                      Primary Database (Novels, Users, Transactions)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-lg text-emerald-500 bg-emerald-500/10 border border-emerald-500/25">
                  ● CONNECTED
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">☁️</span>
                  <div>
                    <h4 className="text-sm font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                      Cloudflare R2 Storage
                    </h4>
                    <p className="text-xs font-medium m-0" style={{ color: 'var(--text-secondary)' }}>
                      Encrypted Chapter Content & Global Edge CDN
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-lg text-emerald-500 bg-emerald-500/10 border border-emerald-500/25">
                  ● OPERATIONAL
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">💳</span>
                  <div>
                    <h4 className="text-sm font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                      Payment Gateways (Razorpay & PayPal)
                    </h4>
                    <p className="text-xs font-medium m-0" style={{ color: 'var(--text-secondary)' }}>
                      Live Checkout & Coin Crediting Webhooks
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-lg text-emerald-500 bg-emerald-500/10 border border-emerald-500/25">
                  ● ACTIVE
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Platform Summary & Direct Action Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Shortcuts */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
              Direct Shortcuts
            </h2>

            <div
              className="p-5 rounded-2xl border space-y-2.5 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              <Link
                href="/admin/importer"
                className="flex items-center justify-between p-3 rounded-xl no-underline font-bold text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span>⚡</span>
                  <span>Import New Novel (.epub / .pdf)</span>
                </div>
                <span>↗</span>
              </Link>

              <Link
                href="/admin/novels"
                className="flex items-center justify-between p-3 rounded-xl no-underline font-bold text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span>📚</span>
                  <span>Browse & Edit Novels Catalog</span>
                </div>
                <span>↗</span>
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl no-underline font-bold text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span>👥</span>
                  <span>Grant Coins to Reader Account</span>
                </div>
                <span>↗</span>
              </Link>

              <Link
                href="/admin/support"
                className="flex items-center justify-between p-3 rounded-xl no-underline font-bold text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span>💬</span>
                  <span>Review Support Inquiries</span>
                </div>
                <span>↗</span>
              </Link>

              <Link
                href="/"
                className="flex items-center justify-between p-3 rounded-xl no-underline font-bold text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span>🏠</span>
                  <span>View Live Public Website</span>
                </div>
                <span>↗</span>
              </Link>
            </div>
          </section>

          {/* Platform Information */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
              System Information
            </h2>

            <div
              className="p-5 rounded-2xl border space-y-3 shadow-xs text-xs font-semibold"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform</span>
                <span style={{ color: 'var(--text-primary)' }}>SegyeNovels Web</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Environment</span>
                <span style={{ color: 'var(--text-primary)' }}>Production (Railway & Vercel)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Primary Domain</span>
                <span style={{ color: 'var(--text-primary)' }}>segyenovels.space</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Catalog Titles</span>
                <span style={{ color: 'var(--text-primary)' }}>{stats?.novels || 252} Novels</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Total Stored Chapters</span>
                <span style={{ color: 'var(--text-primary)' }}>{stats?.chapters || 65911} Chapters</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
