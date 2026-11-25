'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '@/config';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  coins: number;
  is_vip?: boolean;
  unlock_tickets?: number;
  reading_streak?: {
    current_streak: number;
    longest_streak: number;
    last_read_date?: string;
  };
  library?: any[];
  unlocked_chapters?: any[];
  reading_history?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface UserDetailsResponse {
  user: User;
  transactions: any[];
  stats: {
    libraryCount: number;
    unlockedCount: number;
    readingHistoryCount: number;
    transactionsCount: number;
    totalSpent: string;
  };
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'transactions'>('info');

  // Edit Form State
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'user',
    coins: 0,
    is_vip: false,
    unlock_tickets: 3,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
      setUsers(res.data);
    } catch (err: any) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open User View Modal
  const handleOpenView = async (userId: string, defaultTab: 'info' | 'edit' = 'info') => {
    setSelectedUserId(userId);
    setActiveTab(defaultTab);
    setModalLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users/${userId}`, { withCredentials: true });
      setUserDetails(res.data);
      const u = res.data.user;
      setEditForm({
        username: u.username || '',
        email: u.email || '',
        role: u.role || 'user',
        coins: u.coins ?? 100,
        is_vip: !!u.is_vip,
        unlock_tickets: u.unlock_tickets ?? 3,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch user details');
      setSelectedUserId(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Close Modal
  const handleCloseModal = () => {
    setSelectedUserId(null);
    setUserDetails(null);
  };

  // Save Edit Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/admin/users/${selectedUserId}`,
        editForm,
        { withCredentials: true }
      );
      toast.success('User updated successfully!');
      
      // Update local state in list
      setUsers(prev => prev.map(u => u._id === selectedUserId ? { ...u, ...res.data.user } : u));
      
      // Update in modal
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          user: { ...userDetails.user, ...res.data.user }
        });
      }
      setActiveTab('info');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Coin Adjuster (+100, +500, etc.)
  const handleQuickAddCoins = async (amount: number) => {
    if (!selectedUserId || !userDetails) return;
    const newCoins = Math.max(0, (userDetails.user.coins || 0) + amount);
    try {
      const res = await axios.put(
        `${API_URL}/admin/users/${selectedUserId}`,
        { coins: newCoins },
        { withCredentials: true }
      );
      toast.success(`${amount > 0 ? '+' : ''}${amount} coins updated!`);
      setUsers(prev => prev.map(u => u._id === selectedUserId ? { ...u, coins: newCoins } : u));
      setUserDetails({
        ...userDetails,
        user: { ...userDetails.user, coins: newCoins }
      });
      setEditForm(prev => ({ ...prev, coins: newCoins }));
    } catch (err: any) {
      toast.error('Failed to update coins');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${username}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, { withCredentials: true });
      toast.success(`User "${username}" deleted successfully`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      if (selectedUserId === userId) {
        handleCloseModal();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const p = name.trim().split(/\s+/);
    if (p.length > 1) return (p[0][0] + p[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              User Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
              Inspect, manage roles, adjust coins, and view detailed activity for all registered readers.
            </p>
          </div>
          <div style={{
            background: 'var(--accent-soft)',
            border: '1.5px solid var(--accent)',
            padding: '8px 18px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '800',
            color: 'var(--accent)'
          }}>
            Total Users: {users.length}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontWeight: '600'
              }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontWeight: '700',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Roles</option>
            <option value="user">Readers (User)</option>
            <option value="author">Authors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </header>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading users...
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1.5px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Coins</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                      No users match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: u.role === 'admin' ? 'var(--accent)' : '#10b981',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '13px'
                          }}>
                            {getInitials(u.username)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {u.username}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                              Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: '800',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          background: u.role === 'admin' 
                            ? 'var(--accent-soft)' 
                            : u.role === 'author' 
                            ? 'rgba(245, 158, 11, 0.15)' 
                            : 'var(--bg-secondary)',
                          color: u.role === 'admin' ? 'var(--accent)' : u.role === 'author' ? '#f59e0b' : 'var(--text-secondary)',
                          border: u.role === 'admin' 
                            ? '1px solid var(--accent)' 
                            : u.role === 'author' 
                            ? '1px solid rgba(245, 158, 11, 0.3)' 
                            : '1px solid var(--border)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '800', color: '#f59e0b' }}>
                          <span>©</span>
                          <span>{u.coins ?? 0}</span>
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.is_vip ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                            VIP
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Standard</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => handleOpenView(u._id, 'info')}
                            style={{
                              background: 'var(--accent-soft)',
                              border: '1px solid var(--accent)',
                              color: 'var(--accent)',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            View
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleOpenView(u._id, 'edit')}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED USER VIEW / EDIT MODAL */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-2.5 sm:p-4">
          <div
            className="rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-7 border-2"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                  User Details & Controls
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                  ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedUserId}</span>
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '800'
                }}
              >
                ✕
              </button>
            </div>

            {modalLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                Loading user data...
              </div>
            ) : userDetails ? (
              <div>
                {/* User Summary Card */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: userDetails.user.role === 'admin' ? 'var(--accent)' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '20px'
                  }}>
                    {getInitials(userDetails.user.username)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {userDetails.user.username}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)'
                      }}>
                        {userDetails.user.role}
                      </span>
                      {userDetails.user.is_vip && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b'
                        }}>
                          VIP
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px', fontWeight: '500' }}>
                      {userDetails.user.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Registered</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {userDetails.user.createdAt ? new Date(userDetails.user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 4 Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '22px' }}>
                  <div style={statBoxStyle}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>COIN BALANCE</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>
                      © {userDetails.user.coins ?? 0}
                    </div>
                  </div>
                  <div style={statBoxStyle}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>UNLOCKED CHAPTERS</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent)', marginTop: '4px' }}>
                      {userDetails.stats?.unlockedCount ?? (userDetails.user.unlocked_chapters?.length || 0)}
                    </div>
                  </div>
                  <div style={statBoxStyle}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>LIBRARY SAVED</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
                      {userDetails.stats?.libraryCount ?? (userDetails.user.library?.length || 0)}
                    </div>
                  </div>
                  <div style={statBoxStyle}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>TOTAL PURCHASES</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                      {userDetails.stats?.transactionsCount ?? 0}
                    </div>
                  </div>
                </div>

                {/* Quick Coin Adjustment Toolbar */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1.5px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '22px'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#f59e0b' }}>
                    Quick Coin Adjust:
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleQuickAddCoins(100)} style={coinBtnStyle}>+100</button>
                    <button onClick={() => handleQuickAddCoins(500)} style={coinBtnStyle}>+500</button>
                    <button onClick={() => handleQuickAddCoins(1000)} style={coinBtnStyle}>+1000</button>
                    <button onClick={() => handleQuickAddCoins(-100)} style={{ ...coinBtnStyle, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.15)' }}>-100</button>
                  </div>
                </div>

                {/* Modal Navigation Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', marginBottom: '20px' }}>
                  <button
                    onClick={() => setActiveTab('info')}
                    style={{
                      ...tabStyle,
                      borderBottom: activeTab === 'info' ? '2px solid var(--accent)' : '2px solid transparent',
                      color: activeTab === 'info' ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Account Info
                  </button>
                  <button
                    onClick={() => setActiveTab('edit')}
                    style={{
                      ...tabStyle,
                      borderBottom: activeTab === 'edit' ? '2px solid var(--accent)' : '2px solid transparent',
                      color: activeTab === 'edit' ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Edit User & Coins
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    style={{
                      ...tabStyle,
                      borderBottom: activeTab === 'transactions' ? '2px solid var(--accent)' : '2px solid transparent',
                      color: activeTab === 'transactions' ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    Purchases ({userDetails.transactions?.length || 0})
                  </button>
                </div>

                {/* TAB 1: Account Info */}
                {activeTab === 'info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={infoRowStyle}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Username</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{userDetails.user.username}</span>
                    </div>
                    <div style={infoRowStyle}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Email</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{userDetails.user.email}</span>
                    </div>
                    <div style={infoRowStyle}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Role Permission</span>
                      <span style={{ fontWeight: '800', textTransform: 'capitalize', color: 'var(--accent)' }}>
                        {userDetails.user.role}
                      </span>
                    </div>
                    <div style={infoRowStyle}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>VIP Unlimited Reading</span>
                      <span style={{ fontWeight: '800', color: userDetails.user.is_vip ? '#10b981' : 'var(--text-muted)' }}>
                        {userDetails.user.is_vip ? 'Yes (Active)' : 'No (Standard)'}
                      </span>
                    </div>
                    <div style={infoRowStyle}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Current Reading Streak</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                        {userDetails.user.reading_streak?.current_streak ?? 0} days (Record: {userDetails.user.reading_streak?.longest_streak ?? 0} days)
                      </span>
                    </div>
                    <div style={infoRowStyle}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Last Account Update</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                        {userDetails.user.updatedAt ? new Date(userDetails.user.updatedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        onClick={() => setActiveTab('edit')}
                        style={{
                          background: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Edit This User
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: Edit Form */}
                {activeTab === 'edit' && (
                  <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        required
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={labelStyle}>Account Role</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          style={inputStyle}
                        >
                          <option value="user">Reader (User)</option>
                          <option value="author">Author</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Coins Balance</label>
                        <input
                          type="number"
                          value={editForm.coins}
                          onChange={(e) => setEditForm({ ...editForm, coins: Number(e.target.value) })}
                          min={0}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <input
                        type="checkbox"
                        id="vip_toggle"
                        checked={editForm.is_vip}
                        onChange={(e) => setEditForm({ ...editForm, is_vip: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#8e6baf', cursor: 'pointer' }}
                      />
                      <label htmlFor="vip_toggle" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Grant <strong>VIP Status</strong> (bypasses coin lock on all chapters)
                      </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(userDetails.user._id, userDetails.user.username)}
                        disabled={isDeleting}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: isDeleting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete User Permanently'}
                      </button>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveTab('info')}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 22px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: isSaving ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* TAB 3: Transactions */}
                {activeTab === 'transactions' && (
                  <div>
                    {userDetails.transactions && userDetails.transactions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {userDetails.transactions.map((tx: any) => (
                          <div
                            key={tx._id}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                                +{tx.coins_awarded} Coins
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {tx.payment_provider?.toUpperCase()} • {new Date(tx.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '700', color: '#34d399', fontSize: '13px' }}>
                                {tx.currency === 'INR' ? '₹' : '$'}{tx.amount}
                              </div>
                              <div style={{ fontSize: '11px', color: tx.status === 'success' ? '#34d399' : '#ef4444', textTransform: 'uppercase', fontWeight: '800' }}>
                                {tx.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No coin purchase transactions found for this user.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '16px 20px',
  fontSize: '12px',
  fontWeight: '800',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '18px 20px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  fontWeight: '600'
};

const statBoxStyle = {
  background: 'var(--bg-secondary)',
  border: '1.5px solid var(--border)',
  borderRadius: '12px',
  padding: '14px 16px',
  color: 'var(--text-primary)'
};

const tabStyle = {
  background: 'transparent',
  border: 'none',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: '800',
  cursor: 'pointer',
  transition: 'all 0.15s',
  color: 'var(--text-secondary)'
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '13px',
  color: 'var(--text-primary)'
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '800',
  color: 'var(--text-secondary)',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border)',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontWeight: '600'
};

const coinBtnStyle = {
  background: 'rgba(245, 158, 11, 0.15)',
  border: '1.5px solid rgba(245, 158, 11, 0.4)',
  color: '#f59e0b',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '800',
  cursor: 'pointer'
};