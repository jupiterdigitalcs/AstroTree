import { Analytics } from '@vercel/analytics/react'
import '../styles/index.css'

export const metadata = {
  title: 'AstroDig — Free Family Astrology Tree & Sun Sign Chart | Jupiter Digital',
  description:
    "Map your family's astrological sun signs across generations. AstroDig is a free tool to build your family astrology tree, discover inherited cosmic patterns, and explore generational birth charts.",
  keywords:
    'family astrology tree, astrological family tree, sun sign family chart, family birth chart, inherited astrological patterns, generational astrology, cosmic family tree, free astrology tool, AstroDig, Jupiter Digital',
  metadataBase: new URL('https://astrodig.com'),
  alternates: { canonical: '/' },
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://astrodig.com',
    siteName: 'AstroDig by Jupiter Digital',
    title: 'AstroDig — Free Family Astrology Tree',
    description:
      "Map your family's astrological sun signs across generations. Discover inherited cosmic patterns and generational birth charts — free tool by Jupiter Digital.",
    images: [
      {
        url: '/og-image.svg',
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
    title: 'AstroDig — Free Family Astrology Tree',
    description:
      "Map your family's astrological sun signs across generations. Discover inherited cosmic patterns — free tool by Jupiter Digital.",
    images: ['/og-image.svg'],
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
        'A free web application to build your family astrology tree, map sun signs across generations, and discover inherited astrological patterns.',
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Astrology',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Family astrology tree builder',
        'Sun sign assignment per family member',
        'Generational cosmic pattern visualization',
        'Interactive family birth chart',
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
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Raleway:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
