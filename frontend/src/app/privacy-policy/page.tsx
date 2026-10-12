import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#09090b', color: '#fafafa', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', padding: '80px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <header style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '16px', letterSpacing: '-0.02em' }}>Privacy Policy</h1>
          <p style={{ color: '#a1a1aa', fontSize: '15px' }}>Last updated: September 23, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: '#d4d4d8', fontSize: '15px', lineHeight: '1.7' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>1. Information We Collect</h2>
            <p style={{ marginBottom: '12px' }}>We only collect information that is strictly necessary to provide our services:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Account Info:</strong> Email address, username, and encrypted passwords.</li>
              <li><strong>Usage Data:</strong> Your reading history, bookmarks, and unlocked chapters to sync across your devices.</li>
              <li><strong>Payment Info:</strong> We do not store your credit card numbers. All payments are securely processed by Razorpay, Stripe, or PayPal.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>2. How We Use Your Data</h2>
            <p>Your data is used to maintain your account, process transactions, and provide a personalized reading experience (like resuming where you left off). We never sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>3. Data Security</h2>
            <p>We use industry-standard encryption protocols (SSL/TLS) to protect your data in transit. Your passwords are hashed using bcrypt. While we strive to use commercially acceptable means to protect your data, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>4. Your Rights</h2>
            <p>You have the right to request access to the data we hold about you, or ask for your account and associated data to be permanently deleted. Please use the Contact page for these requests.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
