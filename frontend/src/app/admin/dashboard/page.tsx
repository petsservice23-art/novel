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
    <div className="text-[#000000] max-w-[1100px] mx-auto w-full">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#000000] tracking-tight mb-1.5">
          Dashboard Overview
        </h1>
        <p className="text-slate-700 text-xs sm:text-sm">
          Welcome to the SegyeNovels control center. Monitor library size, chapter growth, and reader engagement.
        </p>
      </header>

      {/* Stat Cards (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0"
              style={{ background: card.bg, border: `1.5px solid ${card.color}30` }}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-slate-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider m-0 truncate">
                {card.label}
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-[#000000] m-0 mt-0.5 truncate">
                {card.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#000000] mb-3 sm:mb-4">
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/importer"
            className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 no-underline shadow-xs hover:border-indigo-400 hover:shadow-md transition-all block"
          >
            <div className="text-3xl mb-2.5">⚡</div>
            <h3 className="text-base font-extrabold text-[#000000] m-0 mb-1">
              EPUB / PDF Importer
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm m-0">
              Auto-parse and upload entire books with 50 free chapters.
            </p>
          </Link>

          <Link
            href="/admin/novels"
            className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 no-underline shadow-xs hover:border-indigo-400 hover:shadow-md transition-all block"
          >
            <div className="text-3xl mb-2.5">📚</div>
            <h3 className="text-base font-extrabold text-[#000000] m-0 mb-1">
              Manage Novels & Chapters
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm m-0">
              Hide/unhide novels, edit metadata, delete, or change locking rules.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 no-underline shadow-xs hover:border-indigo-400 hover:shadow-md transition-all block"
          >
            <div className="text-3xl mb-2.5">👥</div>
            <h3 className="text-base font-extrabold text-[#000000] m-0 mb-1">
              User Directory & Coins
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm m-0">
              Inspect user balances, grant coins, or adjust account roles.
            </p>
          </Link>
        </div>
      </section>

      {/* System Status */}
      <section>
        <h2 className="text-lg sm:text-xl font-extrabold text-[#000000] mb-3 sm:mb-4">
          Platform Status
        </h2>
        <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <strong className="text-[#000000] text-sm sm:text-base">Database & Storage Operational</strong>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm m-0 mt-1">
              Connected to MongoDB Atlas and Cloudflare R2 object storage.
            </p>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300 shrink-0">
            ONLINE
          </span>
        </div>
      </section>
    </div>
  );
}
