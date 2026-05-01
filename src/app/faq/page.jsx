import Link from 'next/link'

export const metadata = {
  title: 'FAQ — AstroDig | Family Astrology Chart Builder',
  description:
    'Frequently asked questions about AstroDig — how to build astrology charts for families, friend groups, and coworkers. Free tool by Jupiter Digital.',
  alternates: { canonical: '/faq' },
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://astrodig.com/faq',
    siteName: 'AstroDig by Jupiter Digital',
    title: 'FAQ — AstroDig | Family Astrology Chart Builder',
    description:
      'Frequently asked questions about AstroDig — how to build astrology charts for families, friend groups, and coworkers.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AstroDig by Jupiter Digital' }],
  },
}

const faqs = [
  {
    q: 'What is AstroDig?',
    a: 'AstroDig is a free astrology web app that builds charts for groups of people — family, friends, coworkers, or anyone you know. Enter birthdates and AstroDig calculates sun signs, moon signs, and inner planetary placements (Mercury, Venus, Mars), then visualizes how everyone\'s charts connect through multiple views and an automated insights panel.',
  },
  {
    q: 'Is AstroDig free to use?',
    a: 'Yes — the core experience is free with no account required. You can add unlimited people, explore the family tree view, see sun signs and elemental patterns, save and share charts, and export as PNG. A one-time $9.99 Celestial unlock adds advanced views (Zodiac Wheel, Tables, Constellation), the full Insights analysis, the complete DIG experience, and up to 50 saved charts.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No account required. AstroDig works instantly in the browser. You can optionally add an email address after saving your first chart — this lets you restore your chart from any device if you clear your browser or switch devices.',
  },
  {
    q: 'What information do I need to add someone?',
    a: 'Just a name and birthdate. Birth time is optional but improves accuracy — the moon moves through a sign every 2–3 days, so if someone was born near the end or beginning of a lunar shift, their moon sign can vary. If AstroDig detects a planet changes sign on someone\'s birthday, it shows an ingress warning with the exact changeover time.',
  },
  {
    q: 'What\'s the difference between a sun sign and a moon sign?',
    a: 'Your sun sign is set by the day you were born and reflects core identity and outward energy — it\'s the sign most people know. Your moon sign is where the moon was when you were born and reflects emotional nature, instincts, and inner life. In a family chart, moon sign patterns can be especially revealing about how people connect on a feeling level.',
  },
  {
    q: 'Do families actually share astrological patterns?',
    a: 'Families frequently share astrological patterns — certain signs, elements, or planetary placements that cluster across generations in ways that feel too consistent to be random. You might find that nearly everyone carries strong Scorpio energy, or that water signs dominate one branch while fire signs run through another. These patterns show up not just between parents and children, but in aunts, uncles, and grandparents too. Whether that\'s meaningful or coincidental depends on your perspective, but seeing it laid out visually tends to prompt a lot of recognition.',
  },
  {
    q: 'How does astrological inheritance differ from genetic inheritance?',
    a: 'Genetic inheritance follows bloodlines. Astrological patterns don\'t have to. Stepparents, adoptive families, and chosen families often show up in each other\'s charts in striking ways — shared elements, mirrored placements, or complementary signs that create a kind of cosmic coherence that has nothing to do with DNA. Some people find this more interesting than genetic inheritance, because it suggests that the connections we form aren\'t purely biological. It\'s worth exploring your whole constellation of people, not just blood relatives.',
  },
  {
    q: 'What are generational astrology patterns?',
    a: 'Slower-moving planets like Pluto, Neptune, and Saturn spend years — sometimes decades — in a single sign, so entire generations share those placements. Pluto, for example, defines the core transformational theme of a generation: Pluto in Scorpio (roughly 1983–1995) shaped millennials around themes of depth, power, and hidden systems; Pluto in Sagittarius (1995–2008) shaped Gen Z around belief, expansion, and global connection. When you map a multi-generational family, these Pluto placements can help explain why different age groups in the same family seem to operate from fundamentally different worldviews — it\'s not just personality, it\'s the era they came through.',
  },
  {
    q: 'Can astrology explain why certain family dynamics feel so fixed?',
    a: 'Family dynamics often map onto astrological signatures — the peacemaker, the catalyst, the one who carries everyone\'s emotions tend to reflect identifiable chart patterns. A family with heavy Capricorn energy might feel a strong pull toward achievement and structure; one with a lot of Cancer placements might organize itself around home and care. These aren\'t deterministic — knowing the pattern doesn\'t lock anyone into it — but naming it can shift how you relate to it. That\'s part of what AstroDig is for: making the invisible visible enough to actually look at.',
  },
  {
    q: 'What is "The DIG"?',
    a: 'The DIG is AstroDig\'s signature Wrapped-style story experience — a series of personalized slides that tell your group\'s cosmic narrative. It highlights dominant elements, standout planetary patterns, compatibility threads, and generational themes. Free users see the first 3 slides; the complete DIG experience unlocks with Celestial.',
  },
  {
    q: 'Can I use AstroDig for friend groups or coworkers, not just families?',
    a: 'Absolutely. AstroDig works for any group of people. The Constellation View is especially suited to non-hierarchical groups like friend circles or teams — it shows everyone as connected nodes in a star map rather than a structured family tree. You can mix relationship types freely within a single chart.',
  },
  {
    q: 'What does the Celestial unlock include?',
    a: 'The $9.99 one-time Celestial unlock adds: Zodiac Wheel view, Tables view, Constellation view, the full Insights panel (Notable Bonds, Partner Compatibility, Zodiac Threads, Family Roles, Pluto Generations, Full Compatibility Report), the complete DIG experience, zodiac and PDF exports, and up to 50 saved charts.',
  },
  {
    q: 'Can I share my chart with others?',
    a: 'Yes. Every chart has a shareable link — anyone with the link can view your chart without needing an account or paying anything. Shared links are view-only, so your data stays yours.',
  },
  {
    q: 'Can I export my chart as an image?',
    a: 'Yes. Any view — tree, zodiac wheel, constellation, tables, or insights — can be exported as a PNG. Tree view export is free. Zodiac wheel and other view exports are part of the Celestial unlock.',
  },
  {
    q: 'How accurate are the planetary calculations?',
    a: 'Planetary positions are calculated using Celestine, a precise astronomy library. Sun sign results are exact for nearly all birthdates. Moon and inner planet signs are accurate when birth time is provided, and for most birthdates even without it. If a planet changes sign on or near someone\'s birthday, AstroDig shows an ingress warning with the exact changeover time so you can double-check with a recorded birth time.',
  },
  {
    q: 'What\'s the difference between the tree view and constellation view?',
    a: 'The tree view shows hierarchical family relationships — parents, children, spouses — in a structured layout. The constellation view is a force-directed star map that works for any group, hierarchical or not. It\'s well suited for friend groups, teams, or any mix of people where a family tree structure doesn\'t apply.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': 'https://astrodig.com/faq#faqpage',
      url: 'https://astrodig.com/faq',
      name: 'AstroDig FAQ',
      description: 'Frequently asked questions about AstroDig — the free family astrology chart builder by Jupiter Digital.',
      isPartOf: { '@id': 'https://astrodig.com/#webapp' },
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'AstroDig', item: 'https://astrodig.com' },
        { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://astrodig.com/faq' },
      ],
    },
  ],
}

export default function FaqPage() {
  return (
    <>
      {/* Override body overflow: hidden set globally for the app */}
      <style>{`body { overflow: auto !important; }`}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
              Frequently Asked Questions
            </h1>
            <p style={{
              color: 'var(--text-soft)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              maxWidth: '600px',
            }}>
              Everything you need to know about building astrology charts with AstroDig.
            </p>
          </div>

          {/* FAQ items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {faqs.map(({ q, a }, i) => (
              <div key={i} style={{
                borderTop: '1px solid var(--border)',
                padding: '1.75rem 0',
              }}>
                <h2 style={{
                  fontFamily: "'Cinzel', 'Georgia', serif",
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--gold-light)',
                  letterSpacing: 'var(--ls-label)',
                  marginBottom: '0.75rem',
                  lineHeight: 1.4,
                }}>
                  {q}
                </h2>
                <p style={{
                  color: 'var(--text-soft)',
                  fontSize: '0.975rem',
                  lineHeight: 1.75,
                }}>
                  {a}
                </p>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }} />
          </div>

          {/* CTA */}
          <div style={{
            marginTop: '4rem',
            padding: '2rem',
            background: 'var(--surface)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: '1.1rem',
              color: 'var(--gold)',
              letterSpacing: 'var(--ls-label)',
              marginBottom: '0.75rem',
            }}>
              Ready to explore your cosmic connections?
            </p>
            <p style={{
              color: 'var(--text-soft)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}>
              Free to use — no account required.
            </p>
            <Link href="/" style={{
              display: 'inline-block',
              background: 'var(--gold)',
              color: '#09071a',
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: 'var(--ls-label)',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
            }}>
              Open AstroDig
            </Link>
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
            <a href="https://www.instagram.com/jupreturn" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">Instagram</a>
            {' · '}
            <a href="https://www.tiktok.com/@jupiterdigital" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">TikTok</a>
          </p>
        </footer>

      </div>
    </>
  )
}
