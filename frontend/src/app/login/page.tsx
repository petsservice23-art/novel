'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.success('Google Login configured! Client ID required.');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px',
      background: '#09090b', // Deep minimalist black
      color: '#fafafa',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '380px', 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '8px' }}>Log in to your account</h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Enter your details below to continue.</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'transparent',
            color: '#fafafa',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #27272a',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#18181b'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: '#27272a' }}></div>
          <span style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Or</span>
          <div style={{ flex: 1, height: '1px', background: '#27272a' }}></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#e4e4e7' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#e4e4e7' }}>Password</label>
              <Link href="#" style={{ fontSize: '12px', color: '#a1a1aa', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button style={{
            background: '#fafafa',
            color: '#09090b',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            marginTop: '8px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.8 : 1,
            transition: 'opacity 0.2s'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#a1a1aa' }}>
          Don't have an account? <Link href="/register" style={{ color: '#fafafa', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: '1px solid #27272a',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#fafafa',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};
