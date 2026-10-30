'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SupportChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize unique session ID for guest readers
  useEffect(() => {
    let storedSession = localStorage.getItem('novelverse_support_session');
    if (!storedSession) {
      storedSession = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('novelverse_support_session', storedSession);
    }
    setSessionId(storedSession);
  }, []);

  // Fetch conversation thread whenever modal opens or session/user changes
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchThread();
    }
  }, [isOpen, sessionId, user]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchThread = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/support/thread`, {
        params: { session_id: sessionId },
        withCredentials: true
      });
      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load support thread');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !attachment) || sending) return;

    const outgoingText = message.trim();
    const outgoingAttachment = attachment;
    
    // Optimistic UI update
    const optimisticMsg = {
      sender: 'user',
      content: outgoingText || 'Sent an image attachment',
      attachment: outgoingAttachment,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessage('');
    setAttachment(null);
    setSending(true);

    try {
      const res = await axios.post(`${API_URL}/support/message`, {
        session_id: sessionId,
        content: outgoingText || 'Sent an image attachment',
        attachment: outgoingAttachment,
        sender_name: user?.username || 'Guest Reader',
        sender_email: user?.email || '',
        category: 'general'
      }, { withCredentials: true });

      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      toast.error('Failed to deliver message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  // Support pasting screenshots directly from clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            setAttachment(uploadEvent.target?.result as string);
            toast.success('Screenshot attached!');
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Manual image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAttachment(uploadEvent.target?.result as string);
        toast.success('Screenshot attached!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 1. Floating Pill Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#18181b',
            color: '#fafafa',
            border: '1px solid #27272a',
            borderRadius: '9999px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.15s, background 0.15s, border-color 0.15s',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#3f3f46';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#27272a';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat with us</span>
        </button>
      )}

      {/* 2. Open Support Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: isFullScreen ? '5vh' : '24px',
            right: isFullScreen ? '5vw' : '24px',
            width: isFullScreen ? '90vw' : '400px',
            maxWidth: isFullScreen ? '820px' : 'calc(100vw - 32px)',
            height: isFullScreen ? '85vh' : '540px',
            maxHeight: 'calc(100vh - 48px)',
            background: '#121212',
            border: '1px solid #27272a',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#18181b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22c55e'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#fafafa' }}>Novelverse Support</span>
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Direct chat with our team</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Full Screen Toggle Button */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                style={{
                  background: 'transparent',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.15s, border-color 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#3f3f46'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#27272a'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                <span>{isFullScreen ? 'Exit Full' : 'Full Screen'}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a1a1aa')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Conversation Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.length === 0 ? (
              // Empty State - Screenshot Accurate
              <div style={{
                margin: 'auto',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '20px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '4px'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fafafa', margin: 0 }}>
                  How can we help you?
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#a1a1aa',
                  lineHeight: '1.6',
                  maxWidth: '300px',
                  margin: 0
                }}>
                  Send questions, chapter reports, screenshot bugs, or novel requests. We reply directly here!
                </p>
              </div>
            ) : (
              // Message Stream
              messages.map((m, idx) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isUser && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', marginBottom: '4px' }}>
                        Novelverse Team
                      </span>
                    )}
                    <div style={{
                      background: isUser ? '#27272a' : '#18181b',
                      border: isUser ? '1px solid #3f3f46' : '1px solid #27272a',
                      color: '#fafafa',
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordBreak: 'break-word'
                    }}>
                      {m.content}
                      {m.attachment && (
                        <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3f3f46' }}>
                          <img src={m.attachment} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Screenshot Preview (if pasted or attached) */}
          {attachment && (
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid #27272a',
              background: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={attachment} alt="Screenshot preview" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #3f3f46' }} />
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Screenshot attached</span>
              </div>
              <button
                onClick={() => setAttachment(null)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                Remove
              </button>
            </div>
          )}

          {/* Footer Input Bar */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #27272a',
            background: '#18181b'
          }}>
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type your query or paste screenshot (Ctrl+V)..."
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fafafa',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />

              {/* Image Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Screenshot"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a1a1aa')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={(!message.trim() && !attachment) || sending}
                style={{
                  background: message.trim() || attachment ? '#22c55e' : 'transparent',
                  color: message.trim() || attachment ? '#000' : '#52525b',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: message.trim() || attachment ? 'pointer' : 'default',
                  transition: 'background 0.15s, transform 0.1s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>

            <div style={{
              fontSize: '11px',
              color: '#71717a',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      )}
    </>
  );
}
