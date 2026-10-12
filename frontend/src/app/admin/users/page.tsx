'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  coins: number;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Loading users...</div>;

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>User Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage all registered users and their roles.</p>
      </header>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Coins</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '700', color: '#fff' }}>{u.username}</div>
                </td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '100px', 
                    fontSize: '12px', 
                    fontWeight: '800',
                    background: u.role === 'admin' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: '#fff'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={tdStyle}>🪙 {u.coins}</td>
                <td style={tdStyle}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '20px 24px',
  fontSize: '13px',
  fontWeight: '800',
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px'
};

const tdStyle = {
  padding: '24px',
  fontSize: '15px',
  color: 'var(--text-secondary)'
};
