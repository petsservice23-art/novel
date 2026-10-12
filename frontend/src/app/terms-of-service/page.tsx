import React from 'react';

export default function TermsPage() {
  return (
    <div style={{ background: '#09090b', color: '#fafafa', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', padding: '80px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <header style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '16px', letterSpacing: '-0.02em' }}>Terms of Service</h1>
          <p style={{ color: '#a1a1aa', fontSize: '15px' }}>Last updated: September 23, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: '#d4d4d8', fontSize: '15px', lineHeight: '1.7' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
            <p>By accessing and using Novelverse, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>2. Virtual Currency (Coins)</h2>
            <p style={{ marginBottom: '12px' }}>Coins are virtual currency used exclusively on Novelverse to unlock premium content. They hold no real-world value outside of the platform.</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>All purchases of coins are final and non-refundable.</li>
              <li>Coins never expire as long as your account remains active.</li>
              <li>You may not transfer, sell, or exchange coins with other users.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Any activity occurring under your account is your responsibility. We reserve the right to suspend accounts that violate our policies or engage in fraudulent payment activity.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#fafafa', marginBottom: '12px' }}>4. Content & Intellectual Property</h2>
            <p>All novels, images, and content available on Novelverse are protected by copyright. Unlocking a chapter grants you a personal license to read the content on our platform; it does not grant you ownership or the right to redistribute it.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
