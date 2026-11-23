'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string; terms?: string }>({});

  const { register, loginWithGoogle } = useAuth();

  const validate = () => {
    const errs: { username?: string; email?: string; password?: string; confirmPassword?: string; terms?: string } = {};
    if (!username.trim()) {
      errs.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      errs.terms = 'You must agree to the terms to continue';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      // Error is handled in context
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
        className="register-left-panel"
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
            Join our community of passionate readers
          </h1>
          <p style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.72)',
            marginBottom: '36px'
          }}>
            Unlock early chapter releases, track your reading bookmarks, and support your favorite translators.
          </p>

          {/* Bullet points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              '100 free welcome coins upon registration',
              'Daily check-in rewards & badges',
              'Offline chapter reading mode'
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
              Create an account
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
              Join thousands of readers discovering new stories
            </p>

            {/* Feature Pill */}
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
              <span style={{ fontWeight: '700', color: '#cbd5e1' }}>Sign up to</span>
              <span>• claim 100 coins</span>
              <span>• save favorites</span>
              <span>• sync progress</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: undefined });
                }}
                placeholder="Choose a username"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#161920',
                  border: errors.username ? '1px solid #ef4444' : '1px solid #2a313d',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!errors.username) e.target.style.borderColor = '#8e6baf';
                }}
                onBlur={(e) => {
                  if (!errors.username) e.target.style.borderColor = '#2a313d';
                }}
              />
              {errors.username && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#161920',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #2a313d',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!errors.email) e.target.style.borderColor = '#8e6baf';
                }}
                onBlur={(e) => {
                  if (!errors.email) e.target.style.borderColor = '#2a313d';
                }}
              />
              {errors.email && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Password (min. 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Create a password"
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
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

            {/* Confirm Password with Eye Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '8px',
                    background: '#161920',
                    border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid #2a313d',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!errors.confirmPassword) e.target.style.borderColor = '#8e6baf';
                  }}
                  onBlur={(e) => {
                    if (!errors.confirmPassword) e.target.style.borderColor = '#2a313d';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Agreement Checkbox */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#8e6baf',
                    marginTop: '2px',
                    cursor: 'pointer'
                  }}
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms-of-service" style={{ color: '#a78bfa', textDecoration: 'none' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy-policy" style={{ color: '#a78bfa', textDecoration: 'none' }}>Privacy Policy</Link>
                </span>
              </label>
              {errors.terms && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, fontWeight: '500' }}>
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Create Account Button */}
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
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            {/* OR CONTINUE WITH DIVIDER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
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
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#a78bfa', fontWeight: '700', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>

        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .register-left-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
