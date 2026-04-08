import { notFound } from 'next/navigation'
import { getSupabase } from '../../api/_lib/supabase.js'

function toRow(r) {
  return {
    id: r.id, title: r.title, nodes: r.nodes, edges: r.edges,
    counter: r.counter, savedAt: r.saved_at, shareToken: r.share_token ?? null,
    isPublic: r.is_public, isSample: r.is_sample,
  }
}

async function getChart(token) {
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
    .eq('share_token', token)
    .single()
  if (error || !data) return null
  return toRow(data)
}

// Dynamic metadata with chart title + member count
export async function generateMetadata({ params }) {
  const { token } = await params
  const chart = await getChart(token)
  if (!chart) return { title: 'Chart Not Found — AstroDig' }

  const memberCount = chart.nodes?.length ?? 0
  const title = chart.title || 'Shared Chart'
  const description = `${title} — ${memberCount} member${memberCount !== 1 ? 's' : ''} mapped on AstroDig`

  return {
    title: `${title} — AstroDig`,
    description,
    robots: 'noindex, nofollow',
    openGraph: {
      title: `${title} — AstroDig`,
      description,
      url: `https://astrodig.com/view/${token}`,
      images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — AstroDig`,
      description,
    },
  }
}

// Server component — renders a redirect to the main app with the view token
// The actual chart UI is still client-rendered, but now we get proper metadata
export default async function SharedChartPage({ params }) {
  const { token } = await params
  const chart = await getChart(token)
  if (!chart) notFound()

  const memberCount = chart.nodes?.length ?? 0
  const title = chart.title || 'Shared Chart'

  // Brief landing page before redirect — renders for crawlers and link previews
  return (
    <div style={{ background: '#09071a', color: '#e8dcc8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Raleway, sans-serif', textAlign: 'center', padding: '2rem' }}>
      <meta httpEquiv="refresh" content={`1;url=/?view=${encodeURIComponent(token)}`} />
      <p style={{ fontFamily: 'Cinzel, serif', color: '#c9a84c', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>✦ {title}</p>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>{memberCount} member{memberCount !== 1 ? 's' : ''} mapped on AstroDig</p>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 1.5rem' }}>Loading chart...</p>
      <a href="/" style={{ display: 'inline-block', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '8px', padding: '0.6rem 1.5rem', color: '#c9a84c', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
        ✦ Create Your Own Chart
      </a>
    </div>
  )
}
