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

  // Redirect to main app with view query param — the client-side App handles rendering
  // This gives us server-rendered metadata while keeping the interactive UI
  return (
    <meta httpEquiv="refresh" content={`0;url=/?view=${encodeURIComponent(token)}`} />
  )
}
