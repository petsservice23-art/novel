'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const packages = [
  { name: 'Starter', coins: 1000, bonus: 50, priceUSD: 9.99, priceINR: 999, bonusText: '+5% bonus', popular: false, badge: '' },
  { name: 'Pro', coins: 2400, bonus: 360, priceUSD: 23.99, priceINR: 1399, bonusText: '+15% bonus', popular: false, badge: 'BEST DEAL' },
  { name: 'Elite', coins: 4200, bonus: 1050, priceUSD: 41.99, priceINR: 4199, bonusText: '+25% bonus', popular: true, badge: 'POPULAR' },
  { name: 'Master', coins: 6000, bonus: 2100, priceUSD: 59.99, priceINR: 5999, bonusText: '+35% bonus', popular: false, badge: '' },
  { name: 'Legend', coins: 10000, bonus: 4500, priceUSD: 99.99, priceINR: 9999, bonusText: '+45% bonus', popular: false, badge: '' },
];

export default function CoinsPage() {
  const { user, fetchUser } = useAuth();
  const [buying, setBuying] = useState<string | null>(null);
  
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [payment, setPayment] = useState<'Razorpay' | 'PayPal'>('Razorpay');

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    try {
      const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata';
      if (isIndia) {
        setCurrency('INR');
        setPayment('Razorpay');
      } else {
        setCurrency('USD');
        setPayment('PayPal');
      }
    } catch (e) {
      console.error('Error auto-detecting region:', e);
    }
  }, []);

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (pkgName: string) => {
    if (!user) {
      toast.error('Please sign in to purchase coins');
      return;
    }
    setBuying(pkgName);

    try {
      const res = await axios.post('/api/payments/create', {
        packageName: pkgName,
        paymentMethod: payment.toLowerCase(),
        currency: currency
      });

      const { provider, paymentData, transactionId, razorpayKeyId } = res.data;

      if (provider === 'razorpay') {
        const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!loaded) {
          toast.error('Failed to load Razorpay checkout.');
          setBuying(null);
          return;
        }

        const options = {
          key: razorpayKeyId || 'rzp_test_SqRcPth7rs9HHL',
          amount: paymentData.amount,
          currency: currency,
          name: 'SegyeNovels',
          description: `Unlock premium chapters with ${pkgName} package`,
          order_id: paymentData.orderId,
          handler: async (response: any) => {
            setBuying(pkgName);
            try {
              const verifyRes = await axios.post('/api/payments/verify-razorpay', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: transactionId
              });

              if (verifyRes.data.success) {
                toast.success('Successfully purchased coins!');
                await fetchUser();
              } else {
                toast.error('Verification failed. Please contact support.');
              }
            } catch (err) {
              toast.error('Error verifying payment.');
            } finally {
              setBuying(null);
            }
          },
          prefill: {
            name: user.username,
            email: user.email
          },
          theme: {
            color: '#111111'
          },
          modal: {
            ondismiss: () => {
              setBuying(null);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

      } else if (provider === 'paypal') {
        const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${paymentData.orderId}`;
        window.open(approvalUrl, 'PayPal Payment', 'width=580,height=700,status=no,toolbar=no,menubar=no');
        toast.success('PayPal checkout opened in new window');
        setBuying(null);
      } else {
        toast.success('Payment initiated');
        setBuying(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
      setBuying(null);
    }
  };

  const faqs = [
    {
      q: 'How do coins work?',
      a: 'Coins unlock premium chapters. Each locked chapter shows its coin cost upfront. Once unlocked, that chapter stays accessible forever — no re-purchasing needed.'
    },
    {
      q: 'Do coins expire?',
      a: 'Never. Your coins remain in your account until you choose to spend them — no time limits, no catch.'
    },
    {
      q: 'What payment methods are accepted?',
      a: "It depends on your currency. India & South Asia: UPI, cards, net banking and wallets via Razorpay's secure checkout. Everywhere else: cards and PayPal balance via PayPal."
    },
    {
      q: 'Is my payment secure?',
      a: 'Yes. Payments are handled by Razorpay or PayPal with 256-bit SSL encryption. We never store your card details.'
    },
    {
      q: 'Can I get a refund?',
      a: "Once coins are credited they cannot be refunded. For payment issues, please reach out to our support team and we'll make it right."
    }
  ];

  return (
    <div style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      padding: '48px 16px 80px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        
        {/* Header Block & Balance (Matching Image 3) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Choose a package
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Coins unlock premium chapters instantly and never expire.
            </p>
          </div>

          {/* User Coin Balance Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '6px 14px',
            borderRadius: '100px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              fontWeight: '900',
              fontSize: '12px'
            }}>©</span>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {user?.coins || 0}
            </span>
            <button 
              onClick={() => fetchUser()}
              title="Refresh Balance"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
          </div>
        </div>

        {/* Currency & Payment Toggle Box */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Currency Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CURRENCY:
            </span>
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => {
                  setCurrency('INR');
                  setPayment('Razorpay');
                }}
                style={currency === 'INR' ? activeToggleStyle : inactiveToggleStyle}
              >
                INR (₹)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrency('USD');
                  setPayment('PayPal');
                }}
                style={currency === 'USD' ? activeToggleStyle : inactiveToggleStyle}
              >
                USD ($)
              </button>
            </div>
          </div>

          {/* Payment Method Toggle (Auto-locked to corresponding provider) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PAYMENT:
            </span>
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => {
                  setCurrency('INR');
                  setPayment('Razorpay');
                }}
                style={payment === 'Razorpay' ? activeToggleStyle : inactiveToggleStyle}
              >
                <span>⚡</span> Razorpay (UPI / Cards)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrency('USD');
                  setPayment('PayPal');
                }}
                style={payment === 'PayPal' ? activeToggleStyle : inactiveToggleStyle}
              >
                <span>💳</span> PayPal (Cards / PayPal)
              </button>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div style={{
          background: 'rgba(142, 107, 175, 0.08)',
          border: '1px solid rgba(142, 107, 175, 0.25)',
          color: 'var(--text-primary)',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px'
        }}>
          <span style={{ color: 'var(--accent)', fontSize: '16px' }}>🛡️</span>
          <span>
            {currency === 'INR' 
              ? 'Secure checkout via Razorpay — UPI (GPay, PhonePe, Paytm), NetBanking, and all major Credit/Debit Cards supported.'
              : 'Secure checkout via PayPal — International Credit/Debit Cards and PayPal account supported.'}
          </span>
        </div>

        {/* Coin Packages: Strictly 2 Columns Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '48px'
        }}>
          {packages.map((pkg) => {
            const isPopular = pkg.popular;
            const priceDisplay = currency === 'INR' ? `₹${pkg.priceINR.toLocaleString('en-IN')}` : `$${pkg.priceUSD.toFixed(2)}`;

            return (
              <div
                key={pkg.name}
                style={{
                  background: 'var(--bg-card)',
                  border: isPopular ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '20px 16px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: isPopular ? '0 8px 24px rgba(142, 107, 175, 0.18)' : 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Popular / Best Deal Badge */}
                {isPopular && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '800',
                    letterSpacing: '0.06em',
                    padding: '2px 7px',
                    borderRadius: '100px'
                  }}>
                    POPULAR
                  </span>
                )}

                <div>
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    {pkg.name}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', color: '#f59e0b', fontWeight: '800' }}>©</span>
                    <span style={{ fontSize: 'clamp(20px, 3.2vw, 28px)', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {pkg.coins.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706' }}>
                      +{pkg.bonus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <span style={{ fontSize: 'clamp(15px, 2.4vw, 19px)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {priceDisplay}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706' }}>
                      {pkg.bonusText}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.name)}
                  disabled={buying === pkg.name}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    background: isPopular ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: isPopular ? '#fff' : 'var(--text-primary)',
                    border: isPopular ? 'none' : '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: buying === pkg.name ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {buying === pkg.name ? 'Processing...' : (pkg.badge ? pkg.badge.toLowerCase() : 'Choose plan')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Value Props Row (4 Cards, Matching Image 3) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '56px'
        }}>
          {[
            { title: 'Secure payment', desc: '256-bit SSL encrypted', icon: '🛡️' },
            { title: 'Instant delivery', desc: 'No waiting or delay', icon: '⚡' },
            { title: 'Bonus coins', desc: 'Extra on larger packs', icon: '🎁' },
            { title: 'Never expire', desc: 'Use anytime forever', icon: '🕒' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '24px' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion (Matching Image 3) */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Frequently asked questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 16px',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '12px'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Chat Pill Button (Matching Image 3) */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/support"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              padding: '10px 22px',
              borderRadius: '100px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Need help? <strong>Support chat</strong></span>
          </Link>
        </div>

      </div>
    </div>
  );
}

const activeToggleStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  background: 'var(--accent)',
  color: '#ffffff',
  border: 'none',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
  transition: 'all 0.15s ease'
};

const inactiveToggleStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: 'none',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.15s ease'
};
