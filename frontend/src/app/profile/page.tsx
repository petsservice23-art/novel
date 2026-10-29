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
    router.replace(`/profile?tab=${tab}`);
  };

  if (!user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#121212', color: '#a1a1aa' }}>
        <h2>Sign in to access your profile</h2>
        <Link href="/login" style={{ background: '#749275', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
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
  const memberSince = profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'September 22, 2024';

  return (
    <div style={{ minHeight: '90vh', background: '#121212', color: '#fafafa', padding: '40px 20px 100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Navigation Tabs Header */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '36px' }}>
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

        {/* 1. DASHBOARD TAB (Screenshot Accurate - Image 2) */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>Dashboard</h1>
              <p style={{ color: '#a1a1aa', fontSize: '15px' }}>Your reading activity at a glance</p>
            </div>

            {/* 4 Stat Cards in a row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '48px' }}>
              <StatCard count={bookmarkedCount} label="Bookmarked" icon="🔖" color="#3b82f6" />
              <StatCard count={chaptersReadCount} label="Chapters Read" icon="📖" color="#10b981" />
              <StatCard count={0} label="Completed" icon="✓" color="#22c55e" />
              <StatCard count={coinsSpent} label="Coins Spent" icon="©" color="#f59e0b" />
            </div>

            {/* Bookmarked Library Section */}
            {bookmarkedCount === 0 ? (
              <div style={{ 
                padding: '60px 24px', 
                background: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '16px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontSize: '20px', marginBottom: '8px' }}>
                  📱
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Your library is empty</h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '440px', lineHeight: '1.6' }}>
                  Start bookmarking novels to build your library. Tap the bookmark icon on any novel to save it here and track your reading progress.
                </p>
                <Link href="/browse" style={{ marginTop: '12px', background: '#749275', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
                  Browse Novels
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>My Bookmarks ({bookmarkedCount})</h2>
                  <Link href="/browse" style={{ color: '#749275', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                    + Find More
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {libraryNovels.map((novel: any) => (
                    <Link key={novel._id} href={`/novel/${novel._id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ 
                        background: '#18181b', 
                        border: '1px solid #27272a', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        transition: 'transform 0.2s, border-color 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#749275'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#27272a'; }}
                      >
                        <div style={{ height: '260px', overflow: 'hidden' }}>
                          <img src={novel.cover_image || '/covers/default.jpg'} alt={novel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '16px' }}>
                          <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{novel.title}</h4>
                          <span style={{ fontSize: '12px', color: '#749275', fontWeight: '600' }}>Continue Reading &rarr;</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SETTINGS TAB (Screenshot Accurate - Image 3) */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>Settings</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Profile Card */}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Profile</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#27272a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' }}>
                    {displayName.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#749275', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Change</span>
                      <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Remove</span>
                    </div>
                    <p style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>JPEG, PNG, WebP, GIF, or AVIF · Max 2MB</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#a1a1aa', marginBottom: '8px' }}>Display Name</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      style={inputFieldStyle}
                    />
                    <span style={{ display: 'block', color: '#71717a', fontSize: '12px', marginTop: '6px' }}>This name will be shown on your profile and comments.</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSavingProfile}
                    style={{ background: '#fafafa', color: '#09090b', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', width: 'fit-content' }}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Account Card */}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Account</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Email</span>
                    <span style={{ fontSize: '15px', color: '#fafafa', fontWeight: '500' }}>{email}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Username</span>
                    <span style={{ fontSize: '15px', color: '#fafafa', fontWeight: '500' }}>{user.username}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Member since</span>
                    <span style={{ fontSize: '15px', color: '#fafafa', fontWeight: '500' }}>{memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Security</h3>
                
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#a1a1aa', marginBottom: '8px' }}>New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="Enter at least 6 characters..."
                      style={inputFieldStyle}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isChangingPassword || !newPassword}
                    style={{ background: '#27272a', color: '#fff', border: '1px solid #3f3f46', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', width: 'fit-content' }}
                  >
                    {isChangingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* 3. TRANSACTIONS TAB (Screenshot Accurate - Image 4) */}
        {activeTab === 'transactions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>Transactions</h1>
                <p style={{ color: '#a1a1aa', fontSize: '15px' }}>{transactions.length} total transactions</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#18181b', padding: '12px 20px', borderRadius: '12px', border: '1px solid #27272a' }}>
                <span style={{ color: '#a1a1aa', fontSize: '14px' }}>Balance</span>
                <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{profileData?.coins || user.coins || 0}</span>
                  <span style={{ fontSize: '16px' }}>©</span>
                </span>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div style={{ 
                padding: '80px 24px', 
                background: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '16px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '26px', fontWeight: '900', marginBottom: '8px' }}>
                  ©
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>No transactions yet</h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '400px' }}>
                  Your coin purchases and chapter unlocks will appear here.
                </p>
                <Link href="/coins" style={{ marginTop: '12px', background: '#eab308', color: '#000', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>©</span>
                  <span>Get Coins</span>
                </Link>
              </div>
            ) : (
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid #27272a', color: '#71717a', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>
                  <span>TYPE</span>
                  <span>AMOUNT</span>
                  <span>STATUS</span>
                  <span style={{ textAlign: 'right' }}>DATE</span>
                </div>
                {transactions.map(t => (
                  <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid #27272a', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{t.type === 'coins' ? 'Coin Bundle' : 'Chapter Unlock'}</span>
                    <span style={{ color: '#f59e0b', fontWeight: '700' }}>+{t.coins_awarded} ©</span>
                    <span style={{ color: t.status === 'success' ? '#22c55e' : '#ef4444', textTransform: 'capitalize', fontWeight: '600' }}>{t.status}</span>
                    <span style={{ textAlign: 'right', color: '#71717a', fontSize: '13px' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
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
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '8px',
        background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        border: '1px solid ' + (active ? '#3f3f46' : 'transparent'),
        color: active ? '#fff' : '#a1a1aa',
        fontSize: '14px',
        fontWeight: active ? '700' : '500',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = '#a1a1aa';
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
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'border-color 0.2s'
    }}>
      <div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
          {count}
        </div>
        <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '500' }}>
          {label}
        </div>
      </div>
      <div style={{ 
        width: '42px', 
        height: '42px', 
        borderRadius: '12px', 
        background: `${color}15`, 
        color: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '700'
      }}>
        {icon}
      </div>
    </div>
  );
}

const inputFieldStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#121212',
  border: '1px solid #27272a',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none'
};
