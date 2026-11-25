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
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#000000', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#000000', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Support Inbox 💬
          </h1>
          <p style={{ color: '#374151', fontSize: '15px', margin: 0 }}>
            Manage user inquiries, novel requests, chapter bug reports, and coin questions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '6px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}>
          {['all', 'open', 'in_progress', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: filter === f ? '#6366f1' : 'transparent',
                color: filter === f ? '#ffffff' : '#000000',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
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
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', minHeight: '650px' }}>
        
        {/* Left Column: Tickets List */}
        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', fontSize: '14px', color: '#000000', background: '#f8fafc' }}>
            CONVERSATIONS ({tickets.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
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
                      borderBottom: '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', color: '#000000', fontSize: '14px' }}>
                        {t.user_id?.username || t.sender_name || 'Guest Reader'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: t.status === 'open' ? '#fee2e2' : t.status === 'in_progress' ? '#fef3c7' : '#dcfce7',
                        color: t.status === 'open' ? '#991b1b' : t.status === 'in_progress' ? '#92400e' : '#166534',
                        textTransform: 'uppercase'
                      }}>
                        {t.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                      {lastMsg?.content || 'No message'}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
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
        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          {selectedTicket ? (
            <>
              {/* Ticket Details Bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '16px', color: '#000000' }}>
                      {selectedTicket.user_id?.username || selectedTicket.sender_name || 'Guest Reader'}
                    </span>
                    {selectedTicket.user_id && (
                      <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                        Registered User ({selectedTicket.user_id.coins || 0} ©)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Email: {selectedTicket.sender_email || 'None'} • Session: {selectedTicket.session_id?.substring(0, 12)}...
                  </div>
                </div>

                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolveTicket(selectedTicket._id)}
                    style={{
                      background: '#ecfdf5',
                      border: '1.5px solid #10b981',
                      color: '#065f46',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Mark as Resolved
                  </button>
                )}
              </div>

              {/* Message History */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
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
                      <span style={{ fontSize: '11px', fontWeight: '800', color: isSupport ? '#4338ca' : '#475569', marginBottom: '4px' }}>
                        {isSupport ? 'You (Support Admin)' : selectedTicket.sender_name || 'Reader'}
                      </span>
                      <div style={{
                        background: isSupport ? '#6366f1' : '#f1f5f9',
                        color: isSupport ? '#ffffff' : '#000000',
                        padding: '12px 18px',
                        borderRadius: isSupport ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        border: isSupport ? 'none' : '1px solid #cbd5e1'
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
                      <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div style={{ padding: '16px 24px', borderTop: '1.5px solid #cbd5e1', background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your official reply to this reader..."
                    rows={2}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#000000',
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
                    style={{
                      background: '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 24px',
                      fontWeight: '800',
                      fontSize: '14px',
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
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📬</div>
              <h3 style={{ color: '#000000', fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
                No Conversation Selected
              </h3>
              <p style={{ fontSize: '14px', color: '#475569' }}>
                Select an inquiry from the left panel to inspect message history and reply.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
