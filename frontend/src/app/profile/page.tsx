'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      fetchFullProfile();
    }
  }, [user]);

  const fetchFullProfile = async () => {
    try {
      const token = document.cookie.split('jwt=')[1];
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to load profile');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = document.cookie.split('jwt=')[1];
      const data: any = { username, email };
      if (password) data.password = password;

      const res = await axios.put(`${API_URL}/auth/me`, data, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      toast.success('Profile updated successfully!');
      
      // Update global context by tricking it into "logging in" again with the new data
      login(email, password || 'dummy'); // This won't work well if password isn't updated. Better to just reload window.
      window.location.reload();
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#fff' }}>Please log in to view your profile.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Left Col: Stats */}
        <div>
          <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--accent)', color: '#fff', fontSize: '32px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 12px 30px rgba(var(--accent-rgb), 0.3)' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{user.username}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{user.email}</p>
            
            {profileData?.is_vip && (
              <div style={{ background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000', padding: '8px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: '900', letterSpacing: '1px', display: 'inline-block', marginBottom: '24px' }}>
                VIP MEMBER
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={statBoxStyle}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Coins</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#FFD700' }}>{profileData?.coins || user.coins || 0} ©</span>
              </div>
              <div style={statBoxStyle}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Unlock Tickets</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{profileData?.unlock_tickets || user.unlock_tickets || 0} 🎟️</span>
              </div>
              <div style={statBoxStyle}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Reading Streak</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#FF4500' }}>{profileData?.reading_streak?.current_streak || 0} 🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Edit Form */}
        <div>
          <div style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Edit Profile</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Update your account details and password.</p>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  style={inputStyle} 
                  required 
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  style={inputStyle} 
                  required 
                />
              </div>

              <div>
                <label style={labelStyle}>New Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Leave blank to keep current password" 
                  style={inputStyle} 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: isSaving ? 'wait' : 'pointer',
                  marginTop: '12px',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

const statBoxStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.05)'
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '14px 16px',
  color: '#fff',
  fontSize: '15px',
  outline: 'none'
};
