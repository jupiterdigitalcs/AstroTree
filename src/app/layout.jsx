import { Analytics } from '@vercel/analytics/react'
import '../styles/index.css'

export const metadata = {
  title: 'AstroDig — Map Your Cosmic Connections | Jupiter Digital',
  description:
    "Map cosmic connections between family, friends, and coworkers. AstroDig builds your astrology chart with sun signs, moon signs, planetary placements, compatibility insights, and The DIG — your Wrapped-style cosmic story.",
  keywords:
    'family astrology, astrology chart builder, sun sign chart, moon sign compatibility, zodiac wheel, family birth chart, cosmic connections, astrology insights, The DIG, AstroDig, Jupiter Digital',
  metadataBase: new URL('https://astrodig.com'),
  alternates: { canonical: '/' },
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://astrodig.com',
    siteName: 'AstroDig by Jupiter Digital',
    title: 'AstroDig — Map Your Cosmic Connections',
    description:
      "Build your astrology chart — sun signs, moon signs, compatibility, zodiac wheel, and The DIG. Free tool by Jupiter Digital.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AstroDig — Cosmic Connections by Jupiter Digital',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@jupiter_dig',
    creator: '@jupiter_dig',
    title: 'AstroDig — Map Your Cosmic Connections',
    description:
      "Build your astrology chart — sun signs, moon signs, compatibility, zodiac wheel, and The DIG. Free tool by Jupiter Digital.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    apple: '/apple-touch-icon.png',
  },
  other: {
    'theme-color': '#09071a',
  },
}

// Structured data (JSON-LD)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://astrodig.com/#webapp',
      name: 'AstroDig',
      alternateName: 'AstroDig — Cosmic Connections',
      url: 'https://astrodig.com',
      description:
        'A free web application to map cosmic connections — build astrology charts with sun signs, moon signs, planetary placements, compatibility insights, zodiac wheel, and The DIG.',
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Astrology',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Family and group astrology chart builder',
        'Sun, moon, and planetary sign tracking',
        'Zodiac wheel and constellation visualizations',
        'Compatibility insights and cosmic connection analysis',
        'The DIG — Wrapped-style cosmic story experience',
      ],
      creator: { '@id': 'https://astrodig.com/#organization' },
      publisher: { '@id': 'https://astrodig.com/#organization' },
      inLanguage: 'en-US',
      isAccessibleForFree: true,
      screenshot: 'https://astrodig.com/og-image.svg',
    },
    {
      '@type': 'Organization',
      '@id': 'https://astrodig.com/#organization',
      name: 'Jupiter Digital',
      url: 'https://astrodig.com',
      description:
        'Jupiter Digital creates astrology tools and content for celestial exploration and modern families.',
      sameAs: [
        'https://www.instagram.com/jupreturn',
        'https://www.tiktok.com/@jupiterdigital',
        'https://x.com/jupiter_dig',
        'https://www.etsy.com/shop/jupiterdigital',
      ],
      logo: { '@type': 'ImageObject', url: 'https://astrodig.com/favicon.svg' },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts — loaded via link to match existing CSS font-family references */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Raleway:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
