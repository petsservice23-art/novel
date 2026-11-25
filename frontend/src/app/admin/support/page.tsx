'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/support/admin/tickets`, {
        params: { status: filter },
        withCredentials: true
      });
      setTickets(Array.isArray(res.data) ? res.data : []);
      if (selectedTicket) {
        const updated = res.data.find((t: any) => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);

    try {
      const res = await axios.post(`${API_URL}/support/admin/reply`, {
        ticket_id: selectedTicket._id,
        content: replyText.trim(),
        status: 'in_progress'
      }, { withCredentials: true });

      toast.success('Reply delivered to user!');
      setSelectedTicket(res.data);
      setReplyText('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await axios.put(`${API_URL}/support/admin/tickets/${ticketId}/status`, {
        status: 'resolved'
      }, { withCredentials: true });

      toast.success('Ticket marked as resolved!');
      setSelectedTicket(res.data);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)', paddingBottom: '60px' }}>
      
      {/* Header */}
      {/* Top Bar with Responsive Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Support Inbox 💬
          </h1>
          <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
            Manage user inquiries, novel requests, chapter bug reports, and coin questions.
          </p>
        </div>

        {/* Filter Tabs (Horizontal Scrollable) */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-xl border max-w-full shrink-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)'
          }}
        >
          {['all', 'open', 'in_progress', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer capitalize whitespace-nowrap transition-all border-0 ${
                filter === f ? 'shadow-xs' : ''
              }`}
              style={
                filter === f
                  ? {
                      background: 'var(--accent-gradient)',
                      color: '#ffffff'
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--text-secondary)'
                    }
              }
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Responsive Split Layout: Ticket List & Conversation View */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 sm:gap-6 min-h-[600px]">
        
        {/* Left Column: Tickets List (hidden on mobile when ticket is open) */}
        <div
          className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} rounded-2xl overflow-hidden flex-col shadow-xs border`}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)'
          }}
        >
          <div
            className="p-3.5 sm:p-4 border-b font-extrabold text-xs sm:text-sm flex justify-between items-center"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <span>CONVERSATIONS ({tickets.length})</span>
            <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{filter}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No {filter !== 'all' ? filter : ''} inquiries found.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                const lastMsg = t.messages?.[t.messages.length - 1];
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--accent-soft)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>
                        {t.user_id?.username || t.sender_name || 'Guest Reader'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: t.status === 'open' ? 'rgba(239, 68, 68, 0.15)' : t.status === 'in_progress' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: t.status === 'open' ? '#ef4444' : t.status === 'in_progress' ? '#f59e0b' : '#10b981',
                        border: t.status === 'open' ? '1px solid rgba(239, 68, 68, 0.3)' : t.status === 'in_progress' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                        textTransform: 'uppercase'
                      }}>
                        {t.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                      {lastMsg?.content || 'No message'}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t.sender_email || 'No email provided'}</span>
                      <span>{new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat History & Reply (hidden on mobile if no ticket is selected) */}
        <div
          className={`${selectedTicket ? 'flex' : 'hidden lg:flex'} rounded-2xl flex-col overflow-hidden shadow-xs min-h-[480px] border`}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)'
          }}
        >
          {selectedTicket ? (
            <>
              {/* Ticket Details Bar */}
              <div
                className="p-3.5 sm:p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                <div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden text-xs font-bold px-2.5 py-1 rounded-md mb-2 flex items-center gap-1 cursor-pointer border"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    ← Back to Conversations
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>
                      {selectedTicket.user_id?.username || selectedTicket.sender_name || 'Guest Reader'}
                    </span>
                    {selectedTicket.user_id && (
                      <span style={{ fontSize: '11px', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                        Registered User ({selectedTicket.user_id.coins || 0} ©)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Email: {selectedTicket.sender_email || 'None'} • Session: {selectedTicket.session_id?.substring(0, 12)}...
                  </div>
                </div>

                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolveTicket(selectedTicket._id)}
                    className="w-full sm:w-auto py-2 px-4 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 text-center border"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      color: '#10b981'
                    }}
                  >
                    ✓ Mark as Resolved
                  </button>
                )}
              </div>

              {/* Message History */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: 'var(--bg-card)'
                }}
              >
                {selectedTicket.messages?.map((m: any, i: number) => {
                  const isSupport = m.sender === 'support';
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isSupport ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSupport ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: '800', color: isSupport ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                        {isSupport ? 'You (Support Admin)' : selectedTicket.sender_name || 'Reader'}
                      </span>
                      <div style={{
                        background: isSupport ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                        color: isSupport ? '#ffffff' : 'var(--text-primary)',
                        padding: '12px 18px',
                        borderRadius: isSupport ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        border: isSupport ? 'none' : '1px solid var(--border)'
                      }}>
                        {m.content}
                        {m.attachment && (
                          <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                            <a href={m.attachment} target="_blank" rel="noopener noreferrer">
                              <img src={m.attachment} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '6px' }} />
                            </a>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div
                className="p-3 sm:p-4 border-t"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your official reply to this reader..."
                    rows={2}
                    style={{
                      flex: 1,
                      background: 'var(--bg-card)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      fontWeight: '500'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendingReply}
                    className="w-full sm:w-auto text-white border-0 rounded-lg py-2.5 px-6 font-extrabold text-xs sm:text-sm cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                    style={{
                      background: 'var(--accent-gradient)',
                      boxShadow: '0 2px 10px rgba(142, 107, 175, 0.35)'
                    }}
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📬</div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
                No Conversation Selected
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Select an inquiry from the left panel to inspect message history and reply.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
