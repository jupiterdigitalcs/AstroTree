import JourneyClient from './JourneyClient.jsx'

export const metadata = {
  title: 'Your Journey — AstroDig',
  description:
    'The major chapters of your life, mapped in the sky. Past transits and upcoming chapters — in plain language.',
  openGraph: {
    title: 'Your Journey — AstroDig',
    description:
      'See the major planetary chapters of your life — past and future — mapped from your birthdate.',
    url: 'https://astrodig.com/journey',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function JourneyRoute() {
  return <JourneyClient />
}
