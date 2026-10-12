'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('payment');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitted(true);
    toast.success('Your message has been sent to support!');
  };

  return (
    <div style={{ background: '#09090b', color: '#fafafa', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', padding: '100px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '12px', letterSpacing: '-0.02em' }}>Contact Support</h1>
          <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6' }}>Have an issue with your account, coins, or reading experience? We're here to help.</p>
        </header>

        {submitted ? (
          <div style={{ 
            background: 'rgba(116, 146, 117, 0.1)', 
            border: '1px solid #749275', 
            borderRadius: '12px', 
            padding: '40px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Message Received!</h2>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '24px' }}>
              Thank you, {name}. Our team will review your ticket and reply to <b>{email}</b> within 2–4 hours.
            </p>
            <button 
              onClick={() => { setSubmitted(false); setMessage(''); }}
              style={{
                background: '#fafafa',
                color: '#09090b',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#e4e4e7' }}>Your Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#e4e4e7' }}>Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#e4e4e7' }}>Topic</label>
              <select 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={inputStyle}
              >
                <option value="payment">Payment & Coins Issue</option>
                <option value="account">Account Access</option>
                <option value="bug">Report a Bug / Translation Error</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#e4e4e7' }}>Message</label>
              <textarea 
                rows={5}
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
                required
              />
            </div>

            <button 
              type="submit"
              style={{
                background: '#fafafa',
                color: '#09090b',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                marginTop: '8px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Send Message
            </button>
          </form>
        )}

        <div style={{ marginTop: '60px', textAlign: 'center', paddingTop: '40px', borderTop: '1px solid #27272a' }}>
          <p style={{ color: '#71717a', fontSize: '13px' }}>Typical response time: 2-4 hours via Email</p>
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
  padding: '12px 14px',
  color: '#fafafa',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  appearance: 'none' as const
};
