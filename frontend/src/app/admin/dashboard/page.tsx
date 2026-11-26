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
  const [recentNovels, setRecentNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, novelsRes] = await Promise.all([
          axios.get(`${API_URL}/admin/stats`),
          axios.get(`${API_URL}/admin/novels`).catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        if (Array.isArray(novelsRes.data)) {
          setRecentNovels(novelsRes.data.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="animate-spin text-2xl">⏳</span>
          <span>Loading platform metrics...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: (stats?.users || 0).toLocaleString(), icon: '👥', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)' },
    { label: 'Total Novels', value: (stats?.novels || 0).toLocaleString(), icon: '📚', color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' },
    { label: 'Total Chapters', value: (stats?.chapters || 0).toLocaleString(), icon: '📝', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
    { label: 'Platform Revenue', value: `$${(stats?.revenue || 0).toLocaleString()}`, icon: '💰', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)' },
  ];

  return (
    <div className="w-full space-y-8 transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            Welcome to the SegyeNovels control center. Monitor library size, chapter growth, and reader engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Live System</span>
          </span>
        </div>
      </header>

      {/* Spacious 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="p-5 sm:p-6 rounded-2xl border transition-all duration-200 shadow-xs flex items-center gap-4 sm:gap-5"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs"
              style={{
                background: card.bg,
                border: `1.5px solid ${card.color}35`,
              }}
            >
              {card.icon}
            </div>

            <div className="min-w-0">
              <p
                className="text-xs font-extrabold uppercase tracking-wider truncate m-0"
                style={{ color: 'var(--text-muted)' }}
              >
                {card.label}
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black m-0 mt-1 tracking-tight truncate leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {card.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Quick Management Actions
          </h2>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Core Administrative Workflows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/importer"
            className="group p-5 sm:p-6 rounded-2xl border no-underline shadow-xs transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-105"
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
            className="group p-5 sm:p-6 rounded-2xl border no-underline shadow-xs transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-105"
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
            className="group p-5 sm:p-6 rounded-2xl border no-underline shadow-xs transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-105"
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

      {/* Recent Novel Catalog Overview Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
              Recent Library Catalog
            </h2>
            <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Quick glance at latest titles in your database
            </p>
          </div>
          <Link
            href="/admin/novels"
            className="text-xs font-extrabold no-underline px-3 py-1.5 rounded-lg border transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--accent)'
            }}
          >
            View All Novels →
          </Link>
        </div>

        <div
          className="rounded-2xl border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: '800' }}>NOVEL</th>
                  <th style={{ padding: '14px 18px', fontWeight: '800' }}>AUTHOR</th>
                  <th style={{ padding: '14px 18px', fontWeight: '800' }}>CHAPTERS</th>
                  <th style={{ padding: '14px 18px', fontWeight: '800' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontWeight: '800', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentNovels.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No novels found.
                    </td>
                  </tr>
                ) : (
                  recentNovels.map((novel) => {
                    const isHidden = !!novel.is_hidden || novel.status === 'hidden';
                    return (
                      <tr
                        key={novel._id}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        className="hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <td style={{ padding: '12px 18px', color: 'var(--text-primary)', fontWeight: '700' }}>
                          <div className="flex items-center gap-3">
                            <img
                              src={novel.cover_image}
                              alt={novel.title}
                              className="w-8 h-11 object-cover rounded-md border shrink-0"
                              style={{ borderColor: 'var(--border)' }}
                              onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/100/150`; }}
                            />
                            <div>
                              <div className="font-extrabold text-sm line-clamp-1">{novel.title}</div>
                              {novel.alternative_titles && (
                                <div className="text-[11px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                                  {novel.alternative_titles}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                          {novel.author || 'Korean Author'}
                        </td>

                        <td style={{ padding: '12px 18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {novel.total_chapters || 0}
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isHidden ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isHidden ? '#f59e0b' : '#10b981',
                            border: isHidden ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            {isHidden ? '👁️‍🗨️ Hidden' : '🟢 Visible'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <Link
                            href="/admin/novels"
                            className="no-underline px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-block"
                            style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)'
                            }}
                          >
                            Edit →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="pt-2">
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
