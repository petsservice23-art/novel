'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const { login, loginWithGoogle } = useAuth();

  const validate = () => {
    const errs: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errs.identifier = 'This field is required';
    }
    if (!password) {
      errs.password = 'This field is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(identifier, password, rememberMe);
    } catch (err) {
      // Error is toasted in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '656237342191-m887mlvosfiojh461l1ke5f3a3up07k6.apps.googleusercontent.com';

    setGoogleLoading(true);

    const initClient = () => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                await loginWithGoogle({ accessToken: tokenResponse.access_token });
              } catch (err) {
                console.error(err);
              } finally {
                setGoogleLoading(false);
              }
            } else {
              setGoogleLoading(false);
            }
          },
          error_callback: (err: any) => {
            console.error('Google OAuth error:', err);
            setGoogleLoading(false);
          }
        });
        client.requestAccessToken();
      } catch (err) {
        console.error(err);
        toast.error('Could not initialize Google sign-in');
        setGoogleLoading(false);
      }
    };

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      initClient();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initClient();
      script.onerror = () => {
        toast.error('Failed to load Google sign-in service');
        setGoogleLoading(false);
      };
      document.body.appendChild(script);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#0d0f12',
      color: '#f3f4f6',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* LEFT BRAND PANEL (Matching Ownverso Pattern) */}
      <div 
        className="login-left-panel"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #2b1f3d 0%, #1a1424 50%, #120e1a 100%)',
          position: 'relative',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Subtle Decorative Crosses Background Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(142, 107, 175, 0.18) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
          opacity: 0.85,
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#a78bfa',
              display: 'inline-block',
              boxShadow: '0 0 12px #a78bfa'
            }} />
            <span style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.02em'
            }}>
              SegyeNovels
            </span>
          </Link>
        </div>

        {/* Center Pitch Block */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px', margin: '40px 0' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 4vw, 46px)',
            fontWeight: '900',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '20px'
          }}>
            Discover your next favourite story
          </h1>
          <p style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.72)',
            marginBottom: '36px'
          }}>
            Explore a growing library of web novels, light novels, and translated stories — with free chapters every day.
          </p>

          {/* Bullet points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'Free chapters every day',
              'Track your reading progress',
              'Clean, ad-free experience'
            ].map((text, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#c084fc',
                  display: 'inline-block'
                }} />
                <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.88)', fontWeight: '500' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Tag */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
          © {new Date().getFullYear()} SegyeNovels. All rights reserved.
        </div>
      </div>

      {/* RIGHT AUTH FORM PANEL */}
      <div style={{
        flex: 1.1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 24px',
        background: '#0d0f12'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '8px'
            }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
              Sign in to continue reading your favorite novels
            </p>

            {/* Ownverso Feature Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              background: '#161920',
              border: '1px solid #262b36',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#94a3b8',
              letterSpacing: '0.01em'
            }}>
              <span style={{ fontWeight: '700', color: '#cbd5e1' }}>Sign in to</span>
              <span>• continue reading</span>
              <span>• access your library</span>
              <span>• manage purchases</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Email or Username */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Email or Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier) setErrors({ ...errors, identifier: undefined });
                }}
                placeholder="Enter your email or username"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#161920',
                  border: errors.identifier ? '1px solid #ef4444' : '1px solid #2a313d',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!errors.identifier) e.target.style.borderColor = '#8e6baf';
                }}
                onBlur={(e) => {
                  if (!errors.identifier) e.target.style.borderColor = '#2a313d';
                }}
              />
              {errors.identifier && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Enter your password (min. 8 characters)"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '8px',
                    background: '#161920',
                    border: errors.password ? '1px solid #ef4444' : '1px solid #2a313d',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!errors.password) e.target.style.borderColor = '#8e6baf';
                  }}
                  onBlur={(e) => {
                    if (!errors.password) e.target.style.borderColor = '#2a313d';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Eye Icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#8e6baf',
                    cursor: 'pointer'
                  }}
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/support"
                style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: '500' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '8px',
                background: '#8e6baf',
                color: '#ffffff',
                border: 'none',
                fontSize: '15px',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(142, 107, 175, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#7d599f')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#8e6baf')}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            {/* OR CONTINUE WITH DIVIDER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '6px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#262b36' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                OR CONTINUE WITH
              </span>
              <div style={{ flex: 1, height: '1px', background: '#262b36' }} />
            </div>

            {/* GOOGLE BUTTON */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#161920',
                color: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #2a313d',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                opacity: googleLoading ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => !googleLoading && (e.currentTarget.style.background = '#1e232d')}
              onMouseLeave={(e) => !googleLoading && (e.currentTarget.style.background = '#161920')}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Google'}</span>
            </button>

          </form>

          {/* Footer Link */}
          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#94a3b8' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#a78bfa', fontWeight: '700', textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>

        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .login-left-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
