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
      const res = await axios.post(`${API_URL}/support/admin/reply`, {
        ticket_id: ticketId,
        content: 'Your inquiry has been marked as resolved by our support team. Feel free to message back if you have any further questions!',
        status: 'resolved'
      }, { withCredentials: true });

      toast.success('Ticket marked as resolved');
      setSelectedTicket(res.data);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
            Support Inbox 💬
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
            Manage user inquiries, novel requests, chapter bug reports, and coin questions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: '#18181b', padding: '4px', borderRadius: '8px', border: '1px solid #27272a' }}>
          {['all', 'open', 'in_progress', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: filter === f ? '#27272a' : 'transparent',
                color: filter === f ? '#fff' : '#a1a1aa',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s'
              }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Ticket List & Conversation View */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', minHeight: '650px' }}>
        
        {/* Left Column: Tickets List */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', fontWeight: '700', fontSize: '14px', color: '#a1a1aa' }}>
            CONVERSATIONS ({tickets.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#71717a' }}>
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
                      borderBottom: '1px solid #27272a',
                      background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#fafafa', fontSize: '14px' }}>
                        {t.user_id?.username || t.sender_name || 'Guest Reader'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        background: t.status === 'open' ? 'rgba(239, 68, 68, 0.15)' : t.status === 'in_progress' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: t.status === 'open' ? '#ef4444' : t.status === 'in_progress' ? '#f59e0b' : '#22c55e',
                        textTransform: 'uppercase'
                      }}>
                        {t.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                      {lastMsg?.content || 'No message'}
                    </div>

                    <div style={{ fontSize: '11px', color: '#71717a', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t.sender_email || 'No email provided'}</span>
                      <span>{new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat History & Reply */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedTicket ? (
            <>
              {/* Ticket Details Bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121212' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>
                      {selectedTicket.user_id?.username || selectedTicket.sender_name || 'Guest Reader'}
                    </span>
                    {selectedTicket.user_id && (
                      <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                        Registered User ({selectedTicket.user_id.coins || 0} ©)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                    Email: {selectedTicket.sender_email || 'None'} • Session: {selectedTicket.session_id?.substring(0, 12)}...
                  </div>
                </div>

                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolveTicket(selectedTicket._id)}
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid #22c55e',
                      color: '#22c55e',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Mark as Resolved
                  </button>
                )}
              </div>

              {/* Message History */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isSupport ? '#22c55e' : '#a1a1aa', marginBottom: '4px' }}>
                        {isSupport ? 'You (Support)' : selectedTicket.sender_name || 'User'}
                      </span>
                      <div style={{
                        background: isSupport ? '#166534' : '#27272a',
                        color: '#fff',
                        padding: '12px 16px',
                        borderRadius: isSupport ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '14px',
                        lineHeight: '1.5'
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
                      <span style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #27272a', background: '#121212' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply to this reader..."
                    rows={2}
                    style={{
                      flex: 1,
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fafafa',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
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
                    style={{
                      background: '#749275',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 20px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                      opacity: replyText.trim() ? 1 : 0.5
                    }}
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#71717a', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <h3 style={{ color: '#fafafa', fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No Conversation Selected</h3>
              <p style={{ fontSize: '13px', color: '#a1a1aa' }}>Select a ticket from the left panel to read and reply.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
