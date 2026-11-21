'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import API_URL from '@/config';
import { Suspense } from 'react';

function ProfileContent() {
  const { user, logout, fetchUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'transactions'>(
    tabParam === 'settings' ? 'settings' : tabParam === 'transactions' ? 'transactions' : 'dashboard'
  );

  // Profile data & statistics
  const [profileData, setProfileData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Settings form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'settings' || currentTab === 'transactions' || currentTab === 'dashboard') {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.username || '');
      setEmail(user.email || '');
      fetchFullProfile();
      fetchTransactions();
    }
  }, [user]);

  const fetchFullProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to load full profile');
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await axios.get(`${API_URL}/payments/transactions`, { withCredentials: true });
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return toast.error('Display name cannot be empty');
    setIsSavingProfile(true);
    try {
      await axios.put(`${API_URL}/auth/me`, { username: displayName.trim() }, { withCredentials: true });
      toast.success('Profile updated successfully!');
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    setIsChangingPassword(true);
    try {
      await axios.put(`${API_URL}/auth/me`, { password: newPassword }, { withCredentials: true });
      toast.success('Password updated successfully!');
      setNewPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const switchTab = (tab: 'dashboard' | 'settings' | 'transactions') => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  if (!user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)', padding: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>Please sign in to view your profile</h2>
        <Link href="/login" style={{ background: 'var(--accent)', color: '#fff', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
          Sign In
        </Link>
      </div>
    );
  }

  // Stats calculation
  const libraryNovels = profileData?.library || user.library || [];
  const bookmarkedCount = libraryNovels.length;
  const chaptersReadCount = profileData?.reading_history?.length || user.reading_history?.length || 0;
  const unlockedChaptersCount = profileData?.unlocked_chapters?.length || user.unlocked_chapters?.length || 0;
  const coinsSpent = unlockedChaptersCount * 10;
  const memberSince = profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'October 2024';

  return (
    <div style={{ minHeight: '90vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px 16px 100px', transition: 'background-color 0.2s, color 0.2s' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Navigation Tabs Header */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          borderBottom: '1px solid var(--border)', 
          paddingBottom: '12px', 
          marginBottom: '28px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => switchTab('dashboard')} 
            label="Dashboard" 
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => switchTab('settings')} 
            label="Settings" 
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
          />
          <TabButton 
            active={activeTab === 'transactions'} 
            onClick={() => switchTab('transactions')} 
            label="Transactions" 
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="m7 6 5 5"/></svg>}
          />
        </div>

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your reading activity at a glance</p>
            </div>

            {/* 4 Stat Cards: strictly 2 columns on mobile, 4 on desktop */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '12px', 
              marginBottom: '36px' 
            }}>
              <StatCard count={bookmarkedCount} label="Bookmarked" icon="🔖" color="#8E6BAF" />
              <StatCard count={chaptersReadCount} label="Chapters Read" icon="📖" color="#10b981" />
              <StatCard count={unlockedChaptersCount} label="Unlocked" icon="🔓" color="#6366f1" />
              <StatCard count={coinsSpent} label="Coins Spent" icon="©" color="#f59e0b" />
            </div>

            {/* Bookmarked Library Section */}
            {bookmarkedCount === 0 ? (
              <div style={{ 
                padding: '60px 20px', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '20px', marginBottom: '4px' }}>
                  📚
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Your library is empty</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px', lineHeight: '1.6' }}>
                  Start bookmarking novels to build your library. Tap the bookmark icon on any novel to save it here and track your reading progress.
                </p>
                <Link href="/browse" style={{ marginTop: '10px', background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                  Browse Novels
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    My Bookmarks ({bookmarkedCount})
                  </h2>
                  <Link href="/browse" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                    + Find More
                  </Link>
                </div>
                
                {/* Strictly 2 Columns on Mobile, up to 5 on Desktop */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                  gap: '14px',
                  rowGap: '20px'
                }}>
                  {libraryNovels.map((novel: any) => (
                    <Link key={novel._id} href={`/novel/${novel._id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        transition: 'transform 0.2s, border-color 0.2s',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                          <img 
                            src={novel.cover_image || '/covers/default.jpg'} 
                            alt={novel.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${novel._id}/300/400`; }}
                          />
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <h4 style={{ 
                            color: 'var(--text-primary)', 
                            fontSize: '13px', 
                            fontWeight: '700', 
                            lineHeight: '1.3',
                            marginBottom: '4px', 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '34px'
                          }}>
                            {novel.title}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>
                            Continue Reading →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Settings
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your profile, account and preferences</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'clamp(18px, 3vw, 28px)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Profile</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--border)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800' }}>
                    {displayName.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{user.username}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Role: {user.role?.toUpperCase() || 'READER'}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Display Name</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      style={inputFieldStyle}
                    />
                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>This name is shown across your comments and profile.</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSavingProfile}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', width: 'fit-content' }}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Account Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'clamp(18px, 3vw, 28px)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Account Details</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Email</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600', wordBreak: 'break-all' }}>{email}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Username</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>{user.username}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Member since</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>{memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'clamp(18px, 3vw, 28px)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Security & Password</h3>
                
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="At least 6 characters..."
                      style={inputFieldStyle}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isChangingPassword || !newPassword}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', width: 'fit-content' }}
                  >
                    {isChangingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* 3. TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Transactions
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{transactions.length} total transactions</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Balance:</span>
                <span style={{ color: 'var(--gold)', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{profileData?.coins || user.coins || 0}</span>
                  <span>©</span>
                </span>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div style={{ 
                padding: '60px 20px', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '24px', fontWeight: '900', marginBottom: '4px' }}>
                  ©
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>No transactions yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px' }}>
                  Your coin purchases and chapter unlocks will appear here.
                </p>
                <Link href="/coins" style={{ marginTop: '10px', background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>©</span>
                  <span>Get Coins</span>
                </Link>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: '500px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>
                      <span>TYPE</span>
                      <span>AMOUNT</span>
                      <span>STATUS</span>
                      <span style={{ textAlign: 'right' }}>DATE</span>
                    </div>
                    {transactions.map(t => (
                      <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.type === 'coins' ? 'Coin Bundle' : 'Chapter Unlock'}</span>
                        <span style={{ color: 'var(--gold)', fontWeight: '700' }}>+{t.coins_awarded} ©</span>
                        <span style={{ color: t.status === 'success' ? '#10b981' : '#ef4444', textTransform: 'capitalize', fontWeight: '600', fontSize: '12px' }}>{t.status}</span>
                        <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        background: active ? 'var(--accent)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--accent)' : 'transparent'),
        color: active ? '#ffffff' : 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: active ? '700' : '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ count, label, icon, color }: { count: number; label: string; icon: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div>
        <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2px', lineHeight: 1.1 }}>
          {count}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
          {label}
        </div>
      </div>
      <div style={{ 
        width: '36px', 
        height: '36px', 
        borderRadius: '10px', 
        background: 'var(--bg-secondary)', 
        color: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '16px'
      }}>
        {icon}
      </div>
    </div>
  );
}

const inputFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s'
};
