'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const packages = [
  { name: 'Starter', coins: 1000, bonus: 50, priceUSD: 9.99, priceINR: 999, bonusText: '+5% bonus', popular: false, bestValueINR: false, bestValueUSD: false },
  { name: 'Pro', coins: 2400, bonus: 360, priceUSD: 23.99, priceINR: 1399, bonusText: '+15% bonus', popular: false, bestValueINR: true, bestValueUSD: false },
  { name: 'Elite', coins: 4200, bonus: 1050, priceUSD: 41.99, priceINR: 4199, bonusText: '+25% bonus', popular: true, bestValueINR: false, bestValueUSD: false },
  { name: 'Master', coins: 6000, bonus: 2100, priceUSD: 59.99, priceINR: 5999, bonusText: '+35% bonus', popular: false, bestValueINR: false, bestValueUSD: false },
  { name: 'Legend', coins: 10000, bonus: 4500, priceUSD: 99.99, priceINR: 9999, bonusText: '+45% bonus', popular: false, bestValueINR: false, bestValueUSD: true },
];

export default function CoinsPage() {
  const { user, fetchUser } = useAuth();
  const [buying, setBuying] = useState<string | null>(null);
  
  const [country, setCountry] = useState('🇮🇳 India');
  const [payment, setPayment] = useState('Razorpay');
  const [currency, setCurrency] = useState('INR');

  const [paypalTransaction, setPaypalTransaction] = useState<{ orderId: string; transactionId: string } | null>(null);

  useEffect(() => {
    try {
      const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata';
      if (isIndia) {
        setCountry('🇮🇳 India');
        setCurrency('INR');
        setPayment('Razorpay');
      } else {
        setCountry('🇺🇸 United States');
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
          toast.error('Failed to load Razorpay. Please check your connection.');
          setBuying(null);
          return;
        }

        const options = {
          key: razorpayKeyId || 'rzp_test_SqRcPth7rs9HHL',
          amount: paymentData.amount,
          currency: currency,
          name: 'Novelverse',
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
                toast.success(`Successfully purchased coins!`);
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
            color: '#09090b'
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
        const popup = window.open(approvalUrl, 'PayPal Payment', 'width=580,height=700,status=no,toolbar=no,menubar=no');
        
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          toast.error('Popup blocked! Please allow popups to complete your PayPal checkout.');
          setBuying(null);
          return;
        }

        setPaypalTransaction({
          orderId: paymentData.orderId,
          transactionId: transactionId
        });

      } else if (provider === 'stripe') {
        toast.success('Stripe payment created (Redirecting...)');
        await axios.post('/api/payments/mock-buy', { amount: packages.find(p => p.name === pkgName)!.coins });
        await fetchUser();
        setBuying(null);
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
      setBuying(null);
    }
  };

  const handleVerifyPayPal = async () => {
    if (!paypalTransaction) return;
    setBuying('verifying');
    try {
      const res = await axios.post('/api/payments/verify-paypal', {
        orderId: paypalTransaction.orderId,
        transactionId: paypalTransaction.transactionId
      });

      if (res.data.success) {
        toast.success('PayPal payment captured! Coins added to your account.');
        await fetchUser();
        setPaypalTransaction(null);
      } else {
        toast.error('PayPal transaction not complete. Please check the checkout window.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'PayPal verification failed.');
    } finally {
      setBuying(null);
    }
  };

  const getPackagePriceDisplay = (pkg: any) => {
    if (currency === 'INR') {
      return `₹${pkg.priceINR.toLocaleString('en-IN')}`;
    }
    return `$${pkg.priceUSD.toFixed(2)}`;
  };

  return (
    <div style={{ background: '#09090b', color: '#fafafa', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Hero Section */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '16px', letterSpacing: '-0.02em' }}>Choose a package</h1>
        <p style={{ fontSize: '16px', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6' }}>
          Coins unlock premium chapters instantly and never expire.
        </p>

        {/* Region Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: 'transparent', 
            padding: '4px', 
            borderRadius: '8px', 
            border: '1px solid #27272a', 
            gap: '4px'
          }}>
            <button 
              onClick={() => {
                setCountry('🇮🇳 India');
                setCurrency('INR');
                setPayment('Razorpay');
              }}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                background: currency === 'INR' ? '#18181b' : 'transparent',
                border: currency === 'INR' ? '1px solid #27272a' : '1px solid transparent',
                color: currency === 'INR' ? '#fafafa' : '#71717a',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🇮🇳</span> INR (₹)
            </button>
            <button 
              onClick={() => {
                setCountry('🇺🇸 United States');
                setCurrency('USD');
                setPayment('PayPal');
              }}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                background: currency === 'USD' ? '#18181b' : 'transparent',
                border: currency === 'USD' ? '1px solid #27272a' : '1px solid transparent',
                color: currency === 'USD' ? '#fafafa' : '#71717a',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🌍</span> USD ($)
            </button>
          </div>

          {/* Payment Method Toggle for International */}
          {currency === 'USD' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#71717a', fontWeight: '500', letterSpacing: '0.05em' }}>Payment Method:</span>
              <div style={{ display: 'inline-flex', background: 'transparent', padding: '4px', borderRadius: '8px', border: '1px solid #27272a' }}>
                <button 
                  onClick={() => setPayment('PayPal')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '4px',
                    background: payment === 'PayPal' ? '#18181b' : 'transparent',
                    border: 'none',
                    color: payment === 'PayPal' ? '#fafafa' : '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  PayPal
                </button>
                <button 
                  onClick={() => setPayment('Stripe')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '4px',
                    background: payment === 'Stripe' ? '#18181b' : 'transparent',
                    border: 'none',
                    color: payment === 'Stripe' ? '#fafafa' : '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Stripe
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warning / Informational Alert Box */}
        {payment === 'Razorpay' && (
          <div style={infoAlertStyle}>
            <span style={{ marginRight: '8px' }}>🇮🇳</span>
            Secure Razorpay checkout opens in a popup — please allow popups to complete your purchase.
          </div>
        )}
        {payment === 'PayPal' && (
          <div style={infoAlertStyle}>
            <span style={{ marginRight: '8px' }}>🇺🇸</span>
            PayPal Sandbox Checkout opens in a new tab. Please complete verification there.
          </div>
        )}

        {/* Packages Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '80px', marginTop: '40px' }}>
          {packages.map((pkg) => (
            <div key={pkg.name} style={{
              background: '#09090b',
              borderRadius: '8px',
              padding: '32px 24px',
              border: `1px solid ${pkg.popular ? '#fafafa' : '#27272a'}`,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#18181b'}
            onMouseLeave={e => e.currentTarget.style.background = '#09090b'}
            >
              {pkg.popular && <Tag text="Popular" color="#fafafa" textColor="#09090b" />}
              {(currency === 'INR' ? pkg.bestValueINR : pkg.bestValueUSD) && <Tag text={currency === 'INR' ? "Best deal" : "Best value"} color="#10b981" textColor="#fff" />}
              
              <h3 style={{ fontSize: '13px', fontWeight: '500', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '0.05em' }}>{pkg.name}</h3>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: '600', color: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', letterSpacing: '-0.02em' }}>
                  <span>{pkg.coins}</span>
                  <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '500' }}>©</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#10b981', marginTop: '6px' }}>{pkg.bonusText}</div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '24px', fontWeight: '500', color: '#fafafa' }}>{getPackagePriceDisplay(pkg)}</div>
              </div>

              <button 
                onClick={() => handlePurchase(pkg.name)}
                disabled={buying !== null}
                style={{
                  width: '100%',
                  background: pkg.popular ? '#fafafa' : 'transparent',
                  color: pkg.popular ? '#09090b' : '#fafafa',
                  border: pkg.popular ? 'none' : '1px solid #27272a',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: buying !== null ? 'not-allowed' : 'pointer',
                  marginTop: 'auto',
                  transition: 'opacity 0.2s',
                  opacity: buying === pkg.name ? 0.7 : 1
                }}
              >
                {buying === pkg.name ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', padding: '60px 0', borderTop: '1px solid #27272a' }}>
          <FeatureItem icon="🛡️" title="Secure payment" desc="256-bit SSL encryption" />
          <FeatureItem icon="⚡" title="Instant delivery" desc="No waiting required" />
          <FeatureItem icon="🎁" title="Bonus coins" desc="Included on larger packs" />
          <FeatureItem icon="⏳" title="Never expire" desc="Use your coins anytime" />
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px 100px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', marginBottom: '48px', letterSpacing: '-0.02em' }}>Frequently asked questions</h2>
        <div style={{ display: 'grid', gap: '20px' }}>
          <FAQItem 
            q="What are coins used for?" 
            a="Coins unlock premium chapters. Each locked chapter shows its coin cost upfront. Once unlocked, that chapter stays accessible forever — no re-purchasing needed." 
          />
          <FAQItem 
            q="Do my coins ever expire?" 
            a="Never. Your coins remain in your account until you choose to spend them — no time limits, no catch." 
          />
          <FAQItem 
            q="What payment methods do you accept?" 
            a="We accept Credit/Debit Cards, UPI, Netbanking, Stripe, and PayPal processed through our secure payment partners." 
          />
          <FAQItem 
            q="Is it safe to buy coins here?" 
            a="Yes. Payments are handled by industry leaders with 256-bit SSL encryption. We never store your card details." 
          />
          <FAQItem 
            q="Can I get a refund?" 
            a="Once coins are credited they cannot be refunded. For payment issues, please reach out to our support team and we will get back to you instantly." 
          />
        </div>

        <div style={{ marginTop: '80px', textAlign: 'center', background: '#18181b', padding: '48px', borderRadius: '12px', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '16px', color: '#fafafa', letterSpacing: '-0.02em' }}>Need help with a payment?</h3>
          <Link href="/contact" style={{ display: 'inline-block', background: '#fafafa', color: '#09090b', textDecoration: 'none', padding: '12px 32px', borderRadius: '6px', fontWeight: '500', fontSize: '14px' }}>
            Contact support
          </Link>
        </div>
      </section>

      {/* PayPal Verification Modal overlay */}
      {paypalTransaction && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#fafafa' }}>PayPal Checkout in Progress</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '32px', lineHeight: '1.6', fontSize: '14px' }}>
              We have opened the PayPal checkout window. Please complete your payment there, then click <b>Verify Payment</b> below to capture your coins.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleVerifyPayPal}
                disabled={buying === 'verifying'}
                style={{
                  flex: 1,
                  background: '#fafafa',
                  color: '#09090b',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {buying === 'verifying' ? 'Verifying...' : 'Verify Payment'}
              </button>
              <button 
                onClick={() => {
                  setPaypalTransaction(null);
                  setBuying(null);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#fafafa',
                  border: '1px solid #27272a',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
const Tag = ({ text, color, textColor }: { text: string, color: string, textColor: string }) => (
  <div style={{ 
    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: color, color: textColor, 
    fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px',
    zIndex: 5, letterSpacing: '0.05em'
  }}>{text}</div>
);

const FeatureItem = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '24px', marginBottom: '12px' }}>{icon}</div>
    <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: '#fafafa' }}>{title}</div>
    <div style={{ fontSize: '13px', color: '#71717a' }}>{desc}</div>
  </div>
);

const FAQItem = ({ q, a }: { q: string, a: string }) => (
  <div style={{ background: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a', textAlign: 'left' }}>
    <h4 style={{ fontSize: '15px', fontWeight: '500', marginBottom: '8px', color: '#fafafa' }}>{q}</h4>
    <p style={{ color: '#a1a1aa', lineHeight: '1.6', fontSize: '14px' }}>{a}</p>
  </div>
);

// Style objects
const infoAlertStyle: React.CSSProperties = {
  background: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  padding: '12px 20px',
  borderRadius: '8px',
  color: '#60a5fa',
  fontSize: '13px',
  fontWeight: '500',
  maxWidth: '600px',
  margin: '0 auto 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(9, 9, 11, 0.8)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000
};

const modalStyle: React.CSSProperties = {
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '400px',
  width: '100%',
  textAlign: 'center',
  margin: '0 20px'
};
