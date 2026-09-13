import AppClient from './AppClient.jsx'

export default function HomePage() {
  return (
    <>
      <AppClient />

      {/* Server-rendered content for crawlers and LLMs.
          Hidden once the client app mounts (App.jsx covers the full viewport).
          This is the only content search engines and AI tools see. */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <h1>One Astrology Chart for Your Whole Family</h1>
        <p>
          Map your cosmic connections. AstroDig is a free family astrology chart builder by Jupiter Digital.
          Enter birthdays for your family, friends, or coworkers and see everyone&apos;s sun signs, moon signs,
          and inner planet placements (Mercury, Venus, Mars) together on one chart, along with the patterns
          that tend to run through a group.
        </p>

        <h2>Features</h2>
        <ul>
          <li><strong>Family Tree View</strong>: A family tree with each person&apos;s sign and element, connecting parents, children, spouses, siblings, and friends</li>
          <li><strong>Zodiac Wheel</strong>: A circular 12-sign chart with rings for everyone&apos;s sun, moon, and inner planets</li>
          <li><strong>Constellation View</strong>: A star map of your group, made for friends, coworkers, or any circle that isn&apos;t a family tree</li>
          <li><strong>Tables View</strong>: Everyone&apos;s placements side by side in a sortable table</li>
          <li><strong>Insights Panel</strong>: Automatic reads on your group: element balance, shared signs, partner compatibility, notable bonds, zodiac threads, family roles, Pluto generations</li>
          <li><strong>The DIG</strong>: A Wrapped-style slide story about your group&apos;s cosmic makeup</li>
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
          <strong>Free:</strong> Unlimited people, family tree view, Constellation View, sun signs, element breakdown, cloud save, share links, PNG export, 3 DIG slides.
        </p>
        <p>
          <strong>Celestial unlock ($9.99):</strong> Zodiac Wheel, Tables View,
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
