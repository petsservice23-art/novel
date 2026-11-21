'use client';

import { useState, useEffect, useRef } from 'react';
import API_URL from '@/config';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Message {
  _id?: string;
  sender_type: 'user' | 'admin' | 'guest';
  sender_name?: string;
  text: string;
  attachment?: string | null;
  attachment_name?: string | null;
  created_at?: string;
}

export default function SupportPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender_type: 'admin',
      sender_name: 'SegyeNovels Official (Admin)',
      text: 'Hello! How can we assist you today with your account, coins, novel translations, or reading experience?',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    let s = localStorage.getItem('segyenovels_support_session');
    if (!s) {
      s = 'sess_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('segyenovels_support_session', s);
    }
    setSessionId(s);
  }, []);

  // Fetch thread if exists
  useEffect(() => {
    const fetchExistingThread = async () => {
      if (!sessionId) return;
      try {
        const res = await axios.get(`${API_URL}/support/thread`, {
          params: { session_id: sessionId },
          withCredentials: true
        });
        if (res.data?.messages && res.data.messages.length > 0) {
          const mapped: Message[] = res.data.messages.map((m: any) => ({
            sender_type: m.sender === 'admin' ? 'admin' : (user ? 'user' : 'guest'),
            sender_name: m.sender === 'admin' ? 'SegyeNovels Official (Admin)' : (user?.username || 'You'),
            text: m.content || '',
            attachment: m.attachment || null,
            created_at: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(mapped);
        }
      } catch (err) {
        // Fallback to default greeting
      }
    };
    fetchExistingThread();
  }, [sessionId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle image upload from file picker
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
      setAttachmentName(file.name);
      toast.success('Image ready to send');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle generic file / attachment upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
      setAttachmentName(file.name);
      toast.success(`Attachment "${file.name}" ready to send`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle paste from clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachment(reader.result as string);
            setAttachmentName(`screenshot_${Date.now()}.png`);
            toast.success('Screenshot pasted from clipboard');
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || loading) return;

    const currentText = input.trim();
    const currentAttachment = attachment;
    const currentAttachmentName = attachmentName;

    const userMsg: Message = {
      sender_type: user ? 'user' : 'guest',
      sender_name: user?.username || 'Guest Reader',
      text: currentText || (currentAttachment ? 'Shared an attachment' : ''),
      attachment: currentAttachment,
      attachment_name: currentAttachmentName,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    setAttachmentName(null);
    setLoading(true);

    try {
      await axios.post(`${API_URL}/support/message`, {
        session_id: sessionId || 'default_session',
        content: userMsg.text,
        attachment: currentAttachment,
        sender_name: userMsg.sender_name,
        sender_email: user?.email || '',
        category: 'general'
      }, { withCredentials: true });

      // Automated helpful response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            sender_type: 'admin',
            sender_name: 'SegyeNovels Support Team',
            text: 'Thank you for reaching out! Our team has received your inquiry and files. A support staff member will respond to you shortly.',
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1000);
    } catch (err) {
      console.error('Support message error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      padding: isFullScreen ? '16px' : '36px 16px 80px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: isFullScreen ? '100%' : '960px', margin: '0 auto' }}>
        
        {/* Header Block */}
        {!isFullScreen && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              border: '1px solid var(--border)',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              <span>✨</span>
              <span>REAL-TIME SUPPORT</span>
            </div>

            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 34px)', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              SegyeNovels Support Desk
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', maxWidth: '780px', marginBottom: '16px' }}>
              Have a question about your account, coins, translations, or novel requests? Chat with our team directly. Click <strong>Full Screen</strong> anytime for an expanded view.
            </p>

            {/* Feature Pills Row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={pillStyle}>
                <span>📷</span>
                <span>Image & File Uploads</span>
              </div>
              <div style={pillStyle}>
                <span>📋</span>
                <span>Clipboard Paste (Ctrl+V)</span>
              </div>
              <div style={pillStyle}>
                <span style={{ color: '#10b981' }}>🛡️</span>
                <span>Admin Managed</span>
              </div>
            </div>
          </div>
        )}

        {/* Support Chat Container */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: isFullScreen ? 'calc(100vh - 32px)' : '580px',
          position: 'relative'
        }}>
          {/* Header Bar */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                fontSize: '18px'
              }}>
                💬
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    SegyeNovels Support
                  </h3>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Direct chat with our team
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isFullScreen ? 'Exit Full' : '↗ Full Screen'}</span>
            </button>
          </div>

          {/* Conversation Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((msg, idx) => {
              const isAdmin = msg.sender_type === 'admin';
              return (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAdmin ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  alignSelf: isAdmin ? 'flex-start' : 'flex-end'
                }}>
                  {isAdmin ? (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                      {msg.sender_name} <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: '4px', fontSize: '9px', textTransform: 'uppercase' }}>STAFF</span> · {msg.created_at}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {msg.sender_name} · {msg.created_at}
                    </span>
                  )}

                  <div style={{
                    background: isAdmin ? 'var(--bg-secondary)' : 'var(--accent)',
                    color: isAdmin ? 'var(--text-primary)' : '#fff',
                    border: '1px solid ' + (isAdmin ? 'var(--border)' : 'var(--accent)'),
                    padding: '12px 16px',
                    borderRadius: isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    fontSize: '14px',
                    lineHeight: '1.55',
                    wordBreak: 'break-word',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}

                    {/* Display Attachment if present */}
                    {msg.attachment && (
                      <div style={{ marginTop: msg.text ? '10px' : '0' }}>
                        {msg.attachment.startsWith('data:image/') || msg.attachment.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <div 
                            onClick={() => setEnlargedImage(msg.attachment || null)}
                            style={{ 
                              cursor: 'pointer',
                              borderRadius: '8px', 
                              overflow: 'hidden', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              maxHeight: '240px',
                              maxWidth: '320px',
                              display: 'inline-block'
                            }}
                          >
                            <img 
                              src={msg.attachment} 
                              alt="Attachment" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                            />
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            background: 'rgba(0,0,0,0.15)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            <span>📎</span>
                            <span style={{ fontWeight: '600' }}>{msg.attachment_name || 'Attached Document'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachment Preview Bar */}
          {attachment && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border)',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                {attachment.startsWith('data:image/') ? (
                  <img 
                    src={attachment} 
                    alt="Preview" 
                    style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                  />
                ) : (
                  <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    📎
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                    {attachmentName || 'Selected file'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Ready to attach with message
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  setAttachmentName(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                ✕ Remove
              </button>
            </div>
          )}

          {/* Message Input Box with Real Upload Buttons */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border)',
            padding: '14px 16px 10px'
          }}>
            {/* Hidden File Inputs */}
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*" 
              onChange={handleImageSelect} 
              style={{ display: 'none' }} 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*,.pdf,.doc,.docx,.txt" 
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '10px 14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type your message, or paste screenshot (Ctrl+V)..."
                rows={2}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              />

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Photo / Screenshot Upload Button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Upload Image / Screenshot"
                    style={uploadBtnStyle}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Photo</span>
                  </button>

                  {/* Document / File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Attachment (PDF, Doc, Image)"
                    style={uploadBtnStyle}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Attach</span>
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !attachment) || loading}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: input.trim() || attachment ? 'var(--accent)' : 'var(--border)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() || attachment ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                  </svg>
                </button>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left', marginTop: '6px' }}>
              Enter to send · Shift+Enter for new line · Supports direct photo, document & paste uploads
            </p>
          </div>
        </div>

      </div>

      {/* Enlarged Image Lightbox */}
      {enlargedImage && (
        <div 
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <img 
            src={enlargedImage} 
            alt="Enlarged preview" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
          />
        </div>
      )}
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '100px',
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px'
};

const uploadBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: '8px',
  padding: '4px 10px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.15s ease'
};
