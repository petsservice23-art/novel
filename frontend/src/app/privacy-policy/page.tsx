'use client';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      num: '1',
      title: 'Information We Collect',
      body: 'We collect account and usage information needed to run SegyeNovels, including your email address, username, authentication identifiers, and activity related to reading, purchases, and account security. Payment card data is not stored by SegyeNovels; payment providers process and store payment details under their own policies.'
    },
    {
      num: '2',
      title: 'How We Use Information',
      body: 'We use collected information to provide and improve the service, authenticate users, prevent abuse, process coin purchases, maintain content access records, communicate account-related notices, and comply with legal obligations.'
    },
    {
      num: '3',
      title: 'Cookies and Similar Technologies',
      body: 'SegyeNovels uses essential cookies and similar technologies for login sessions, security controls, and product functionality. Disabling essential cookies may prevent parts of the service from working.'
    },
    {
      num: '4',
      title: 'Data Sharing',
      body: 'We share data only when necessary to operate SegyeNovels, such as with infrastructure providers, payment processors, analytics tools, and legal authorities when required by law. We do not sell personal information.'
    },
    {
      num: '5',
      title: 'Data Retention',
      body: 'We retain personal data only as long as needed for operational, legal, accounting, and security purposes. Retention periods may vary by data type and legal requirements.'
    },
    {
      num: '6',
      title: 'Security',
      body: 'We apply technical and organizational safeguards intended to protect your data. No internet-based service can guarantee absolute security, so users should also protect account credentials and report suspected unauthorized access promptly.'
    },
    {
      num: '7',
      title: 'Your Choices and Rights',
      body: 'Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data. You can also request account deletion by contacting support.'
    },
    {
      num: '8',
      title: "Children's Privacy",
      body: 'SegyeNovels is not intended for children under the age required by applicable law in their jurisdiction. If we learn that personal data was collected from an ineligible user, we will take appropriate action to remove it.'
    },
    {
      num: '9',
      title: 'Changes to This Policy',
      body: 'We may update this Privacy Policy from time to time. Material changes will be reflected by an updated effective date on this page.'
    },
    {
      num: '10',
      title: 'Contact',
      body: 'For privacy-related requests, contact the SegyeNovels support channel used in your account settings or official support email at support@segyenovels.space.'
    },
    {
      num: '11',
      title: 'DMCA Compliance',
      body: 'We respect intellectual property rights and comply with the provisions of the Digital Millennium Copyright Act (DMCA). Content available on this platform, including text and images, is based on the contributions of community members and third-party sources; the website owner is not responsible for content posted by members. If you are the owner of copyrighted content that is being improperly used without your permission, you may request that the content be removed under the DMCA. To make such a request or to resolve questions before filing a formal claim, please contact our designated agent directly at segyenovels@gmail.com. We also recognize that not every takedown notice is valid or submitted in good faith; for guidance on counter-notifications or improperly filed notices, you may consult statutory DMCA resources.'
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
        
        {/* Header Block (Matching Image 7) */}
        <header style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Last updated: March 23, 2026
          </p>
        </header>

        {/* 10 Sections (Matching Image 7) */}
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
