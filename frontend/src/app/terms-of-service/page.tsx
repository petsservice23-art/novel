'use client';

export default function TermsOfServicePage() {
  const sections = [
    {
      num: '1',
      title: 'Acceptance of Terms',
      body: 'By accessing or using SegyeNovels, you agree to these Terms of Service. If you do not agree, do not use the service. You are responsible for ensuring your use complies with applicable laws.'
    },
    {
      num: '2',
      title: 'Accounts and Security',
      body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate account information and notify us of any unauthorized account use.'
    },
    {
      num: '3',
      title: 'Content and Intellectual Property',
      body: 'SegyeNovels and its licensors retain all rights to platform branding, software, and original platform assets. Story content belongs to its respective rights holders. You may not copy, distribute, reverse engineer, or exploit platform content beyond permitted use.'
    },
    {
      num: '4',
      title: 'Coins, Purchases, and Refunds',
      body: 'SegyeNovels may offer virtual coin purchases through supported payment providers. Coins are non-transferable and have no cash value except where required by law. Refund handling is subject to provider rules, local law, and SegyeNovels policy.'
    },
    {
      num: '5',
      title: 'Prohibited Conduct',
      body: 'You may not use SegyeNovels to violate laws, infringe rights, abuse or harass others, attempt unauthorized access, interfere with service operations, or upload malicious content.'
    },
    {
      num: '6',
      title: 'Service Availability and Changes',
      body: 'We may modify, suspend, or discontinue parts of SegyeNovels at any time. We aim for reliable availability but do not guarantee uninterrupted or error-free service.'
    },
    {
      num: '7',
      title: 'Termination',
      body: 'We may suspend or terminate access for violations of these Terms, abuse, fraud, or legal requirements. You may stop using the service at any time and request account deletion where available.'
    },
    {
      num: '8',
      title: 'Disclaimer and Limitation of Liability',
      body: 'SegyeNovels is provided on an "as is" and "as available" basis to the extent permitted by law. We are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the service.'
    },
    {
      num: '9',
      title: 'Governing Law',
      body: 'These Terms are governed by applicable laws in the jurisdiction where SegyeNovels operates, unless otherwise required by mandatory local consumer law.'
    },
    {
      num: '10',
      title: 'Contact',
      body: 'For questions about these Terms, contact SegyeNovels support through the official support channel listed in your account or on the site at support@segyenovels.com.'
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
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* Header Block (Matching Image 8) */}
        <header style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Last updated: March 23, 2026
          </p>
        </header>

        {/* 10 Sections (Matching Image 8) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {sections.map(s => (
            <section key={s.num}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {s.num}. {s.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.75' }}>
                {s.body}
              </p>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
}
