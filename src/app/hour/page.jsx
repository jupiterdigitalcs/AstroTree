import HourClient from './HourClient.jsx'

export const metadata = {
  title: 'The Hour: Find Your Birth Time | AstroDig',
  description:
    'Not sure when you were born? Start with what you know and narrow your birth time window with a few guided questions. A free birth time finder from AstroDig.',
  openGraph: {
    title: 'The Hour: Find Your Birth Time | AstroDig',
    description:
      'A guided birth time finder. Start with what you know, answer a few questions, and narrow down your rising sign.',
    url: 'https://astrodig.com/hour',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function HourRoute() {
  return <HourClient />
}
