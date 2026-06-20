import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy · AstroDig by Jupiter Digital',
  description:
    'How AstroDig by Jupiter Digital LLC collects, uses, stores, and protects your data. What we collect, how we use it, and how to delete it.',
  alternates: { canonical: '/privacy' },
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://astrodig.com/privacy',
    siteName: 'AstroDig by Jupiter Digital',
    title: 'Privacy Policy · AstroDig by Jupiter Digital',
    description:
      'How AstroDig by Jupiter Digital LLC collects, uses, stores, and protects your data.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AstroDig by Jupiter Digital' }],
  },
}

// Section content. Each block is a heading plus paragraphs and/or a bullet list.
// Reused and expanded from the in-app About panel (Your Data & Privacy + Terms).
const LAST_UPDATED = 'June 2026'

const sections = [
  {
    h: 'Who we are',
    p: [
      'AstroDig is a web and iOS app built by Jupiter Digital LLC. It lets you map astrological connections between the people in your life. This policy explains what we collect, how we use it, and the choices you have.',
    ],
  },
  {
    h: 'Information we collect',
    list: [
      'Chart data you enter: names, birthdates, optional birth times, and the astrological placements we calculate from them.',
      'Your account email when you sign in with Google, Apple, or an email magic link.',
      'A device identifier we generate to sync your charts and link your purchases.',
      'Purchase records when you unlock Celestial (handled by our payment processors, not stored as card details on our servers).',
      'Basic, aggregated usage analytics (for example, which views are opened) to understand how the app is used.',
    ],
  },
  {
    h: 'How we use it',
    list: [
      'To sync and store your charts so they follow you across devices.',
      'To link your Celestial purchase to your account, so it works everywhere you sign in.',
      'To send purchase confirmations and occasional updates from Jupiter Digital.',
      'To study anonymized, aggregated astrological patterns across groups (for example, how often family members share a moon sign). No individual names, birthdates, or identifying details are ever published. Only statistical trends across all users combined.',
    ],
  },
  {
    h: 'Who processes your data',
    p: [
      'We use a small number of trusted service providers to run the app. They process data only to provide their service to us:',
    ],
    list: [
      'Supabase stores your charts, account, and entitlements.',
      'Stripe (web) and Apple In-App Purchase with RevenueCat (iOS) process payments and tell us which account unlocked Celestial.',
      'Google and Apple handle sign-in when you choose those options.',
      'Resend sends transactional email such as purchase confirmations and sign-in links.',
      'Vercel hosts the app and provides aggregated, privacy-friendly analytics.',
    ],
  },
  {
    h: 'What we do not do',
    list: [
      'We do not sell your data or share it with third parties for their own marketing.',
      'We do not publish or share any individual chart data, names, or birthdates. Research uses only anonymous aggregate patterns.',
    ],
  },
  {
    h: 'Adding other people',
    p: [
      'AstroDig lets you enter birth information for people in your life. By doing so, you acknowledge that this information was shared with you personally and that you are entering it at your own discretion. We encourage you to get permission from the people you add when you can. Jupiter Digital LLC does not verify consent between users and is not responsible for information entered on behalf of others.',
    ],
  },
  {
    h: 'Keeping and deleting your data',
    p: [
      'You can delete individual charts from the Saved tab at any time. To disconnect your account, sign out from the Saved tab. To request full removal of your data, email us at the address below and we will delete it.',
      'AstroDig is not intended for children under 13.',
    ],
  },
  {
    h: 'Purchases and refunds',
    p: [
      'Celestial is a one-time digital purchase. On iOS, purchases and refunds are handled by Apple under its standard terms. If a technical issue prevents access to features you paid for, contact us and we will make it right.',
    ],
  },
  {
    h: 'Changes to this policy',
    p: [
      'We may update this policy as the app evolves. When we do, we will revise the date below. Continued use of AstroDig means you accept the current version.',
    ],
  },
  {
    h: 'Contact',
    p: [
      'Questions, or want your data removed? Email jupreturns@gmail.com and we will help.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <>
      {/* Override body overflow: hidden set globally for the app */}
      <style>{`body { overflow: auto !important; }`}</style>

      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Raleway', 'Georgia', serif",
      }}>

        {/* Header */}
        <header style={{
          borderBottom: '1px solid var(--border)',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <Link href="/" style={{
            fontFamily: "'Cinzel', 'Georgia', serif",
            fontSize: '1.2rem',
            fontWeight: 600,
            color: 'var(--gold)',
            textDecoration: 'none',
            letterSpacing: 'var(--ls-heading)',
          }}>
            AstroDig
          </Link>
          <Link href="/" style={{
            color: 'var(--text-soft)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            letterSpacing: 'var(--ls-label)',
          }}>
            ← Back to App
          </Link>
        </header>

        {/* Main content */}
        <main style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 2rem 5rem' }}>

          <div style={{ marginBottom: '3rem' }}>
            <p style={{
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: '0.75rem',
              letterSpacing: 'var(--ls-caps)',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}>
              Jupiter Digital
            </p>
            <h1 style={{
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: 'var(--ls-heading)',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              Privacy Policy
            </h1>
            <p style={{
              color: 'var(--text-soft)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              maxWidth: '600px',
            }}>
              Your charts are yours. Here is exactly what we collect, why, and how to remove it.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {sections.map(({ h, p, list }, i) => (
              <section key={i} style={{ borderTop: '1px solid var(--border)', padding: '1.75rem 0' }}>
                <h2 style={{
                  fontFamily: "'Cinzel', 'Georgia', serif",
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--gold-light)',
                  letterSpacing: 'var(--ls-label)',
                  marginBottom: '0.9rem',
                  lineHeight: 1.4,
                }}>
                  {h}
                </h2>
                {p?.map((text, j) => (
                  <p key={j} style={{ color: 'var(--text-soft)', fontSize: '0.975rem', lineHeight: 1.75, marginBottom: list || j < p.length - 1 ? '0.75rem' : 0 }}>
                    {text}
                  </p>
                ))}
                {list && (
                  <ul style={{ color: 'var(--text-soft)', fontSize: '0.975rem', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {list.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }} />
          </div>

        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          letterSpacing: 'var(--ls-label)',
        }}>
          <p>
            AstroDig by{' '}
            <a
              href="https://www.etsy.com/shop/jupiterdigital"
              style={{ color: 'var(--gold-dim)', textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Jupiter Digital
            </a>
            {' · '}
            <Link href="/faq" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>FAQ</Link>
          </p>
        </footer>

      </div>
    </>
  )
}
