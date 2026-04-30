import AppClient from './AppClient.jsx'

export default function HomePage() {
  return (
    <>
      <AppClient />

      {/* Server-rendered content for crawlers and LLMs.
          Hidden once the client app mounts (App.jsx covers the full viewport).
          This is the only content search engines and AI tools see. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <h1>AstroDig — Map Your Cosmic Connections</h1>
        <p>
          AstroDig is a free astrology web app by Jupiter Digital. Enter birthdates for your family,
          friends, or coworkers and see sun signs, moon signs, and planetary placements (Mercury, Venus, Mars)
          calculated instantly. Discover how your charts connect.
        </p>

        <h2>Features</h2>
        <ul>
          <li><strong>Family Tree View</strong> — Hierarchical chart showing parent, child, spouse, sibling, and friend relationships with zodiac signs and elements</li>
          <li><strong>Zodiac Wheel</strong> — Circular 12-sign chart with concentric rings for sun, moon, and inner planets</li>
          <li><strong>Constellation View</strong> — Force-directed star map for friend groups, coworkers, or any non-hierarchical group</li>
          <li><strong>Tables View</strong> — Sortable data grid of everyone&apos;s planetary placements side by side</li>
          <li><strong>Insights Panel</strong> — Automated analysis: element distribution, shared signs, partner compatibility, notable bonds, zodiac threads, family roles, Pluto generations</li>
          <li><strong>The DIG</strong> — A Spotify Wrapped-style slide experience telling your group&apos;s unique cosmic story</li>
        </ul>

        <h2>How It Works</h2>
        <ol>
          <li>Add people — enter name, birthdate, and optionally birth time</li>
          <li>Set relationships — parent, child, spouse, sibling, friend, or coworker</li>
          <li>Explore views — switch between tree, zodiac wheel, constellation, tables, and insights</li>
          <li>Share — generate a link so anyone can view your chart</li>
          <li>Export — download any view as a PNG image</li>
        </ol>

        <h2>Free vs Celestial ($9.99 one-time)</h2>
        <p>
          <strong>Free:</strong> Unlimited people, family tree view, sun signs, element breakdown, cloud save, share links, PNG export, 3 DIG slides.
        </p>
        <p>
          <strong>Celestial unlock ($9.99):</strong> Zodiac Wheel, Tables View, Constellation View,
          full Insights (Notable Bonds, Partner Compatibility, Zodiac Threads, Family Roles, Pluto Generations,
          Full Compatibility Report), the complete DIG experience, and up to 50 saved charts.
        </p>

        <h2>Who It&apos;s For</h2>
        <ul>
          <li>Families exploring generational astrology patterns</li>
          <li>Friend groups comparing birth charts</li>
          <li>Couples checking compatibility beyond just sun signs</li>
          <li>Parents curious about their children&apos;s cosmic makeup</li>
          <li>Anyone who knows birthdates and wants to see what the stars say about their connections</li>
        </ul>

        <h2>About Jupiter Digital</h2>
        <p>
          AstroDig is built by Christina at Jupiter Digital — an astrology brand also on{' '}
          <a href="https://www.etsy.com/shop/jupiterdigital">Etsy</a> selling birthday calendars
          and personalized readings. Follow on{' '}
          <a href="https://www.instagram.com/jupreturn">Instagram</a> and{' '}
          <a href="https://www.tiktok.com/@jupiterdigital">TikTok</a>.
        </p>
      </div>
    </>
  )
}
