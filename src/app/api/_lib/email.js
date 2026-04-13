import { Resend } from 'resend'

let _resend = null

function getResend() {
  if (_resend) return _resend
  _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = 'AstroDig <noreply@astrodig.com>'

/**
 * Send premium purchase confirmation with chart data.
 */
export async function sendPremiumConfirmation({ to, charts }) {
  const resend = getResend()

  const chartSections = charts.map(chart => {
    const members = (chart.nodes || [])
      .filter(n => n.data?.name)
      .sort((a, b) => (a.data.birthdate || '').localeCompare(b.data.birthdate || ''))

    const memberRows = members.map(n => {
      const d = n.data
      const parts = [`${d.name}`]
      if (d.sign) parts.push(`Sun: ${d.sign}`)
      if (d.moonSign && d.moonSign !== 'Unknown') parts.push(`Moon: ${d.moonSign}`)
      const ip = d.innerPlanets
      if (ip?.mercury?.sign) parts.push(`Mercury: ${ip.mercury.sign}`)
      if (ip?.venus?.sign) parts.push(`Venus: ${ip.venus.sign}`)
      if (ip?.mars?.sign) parts.push(`Mars: ${ip.mars.sign}`)
      if (d.birthdate) parts.push(`Born: ${d.birthdate}`)
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #1a1830;color:#e8dcc8">${parts[0]}</td><td style="padding:8px 12px;border-bottom:1px solid #1a1830;color:rgba(255,255,255,0.6);font-size:13px">${parts.slice(1).join(' · ')}</td></tr>`
    }).join('')

    return `
      <div style="margin-bottom:24px">
        <h3 style="font-family:Cinzel,Georgia,serif;color:#c9a84c;font-size:16px;margin:0 0 8px">${chart.title || 'Untitled Chart'}</h3>
        <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.03);border-radius:6px;overflow:hidden">
          ${memberRows || '<tr><td style="padding:8px 12px;color:rgba(255,255,255,0.4)">No members yet</td></tr>'}
        </table>
      </div>
    `
  }).join('')

  const html = `
    <div style="background:#09071a;padding:32px;font-family:'Raleway',Helvetica,Arial,sans-serif;color:#e8dcc8;max-width:600px;margin:0 auto">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="font-family:Cinzel,Georgia,serif;color:#c9a84c;font-size:22px;margin:0">✦ Welcome to AstroDig Celestial</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:8px 0 0">Your cosmic connections, fully unlocked.</p>
      </div>

      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:14px;color:#c9a84c;font-weight:600">What you've unlocked:</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.8">
          <li>Zodiac Wheel &amp; Tables views</li>
          <li>Full Insights — compatibility, roles, zodiac threads</li>
          <li>The complete DIG experience</li>
          <li>Unlimited charts</li>
          <li>All future features</li>
        </ul>
      </div>

      ${charts.length > 0 ? `
        <div style="margin-bottom:24px">
          <h2 style="font-family:Cinzel,Georgia,serif;color:#e8dcc8;font-size:16px;margin:0 0 12px">Your Charts</h2>
          ${chartSections}
        </div>
      ` : ''}

      <div style="text-align:center;margin:24px 0">
        <a href="https://astrodig.com" style="display:inline-block;background:rgba(201,168,76,0.2);border:1px solid rgba(201,168,76,0.4);border-radius:8px;padding:10px 24px;color:#c9a84c;text-decoration:none;font-size:14px;font-weight:600">Open AstroDig</a>
      </div>

      <div style="border-top:1px solid rgba(201,168,76,0.15);padding-top:16px;text-align:center">
        <p style="font-family:Cinzel,Georgia,serif;font-size:11px;color:rgba(201,168,76,0.5);letter-spacing:0.06em;margin:0">✦ AstroDig · Jupiter Digital</p>
        <p style="font-size:10px;color:rgba(255,255,255,0.2);margin:4px 0 0">astrodig.com · jupiterdigitalevents.com</p>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: '✦ Welcome to AstroDig Celestial — Your Charts Inside',
      html,
    })
    return { ok: true }
  } catch (err) {
    console.error('[email] send failed:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Notify the site owner of a new purchase.
 */
export async function sendOwnerPurchaseNotification({ buyerEmail, amount, chartsCount, deviceId }) {
  const resend = getResend()
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) {
    console.warn('[email] OWNER_EMAIL not set — skipping owner notification')
    return { ok: false, error: 'OWNER_EMAIL not configured' }
  }

  const amountStr = amount ? `$${(amount / 100).toFixed(2)}` : '$9.99'
  const html = `
    <div style="background:#09071a;padding:32px;font-family:'Raleway',Helvetica,Arial,sans-serif;color:#e8dcc8;max-width:500px;margin:0 auto">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="font-family:Cinzel,Georgia,serif;color:#c9a84c;font-size:22px;margin:0">✦ New Celestial Purchase</h1>
      </div>
      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:16px;margin-bottom:16px">
        <table style="width:100%;font-size:14px;color:#e8dcc8">
          <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5)">Buyer</td><td style="padding:4px 0">${buyerEmail || 'No email provided'}</td></tr>
          <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5)">Amount</td><td style="padding:4px 0">${amountStr}</td></tr>
          <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5)">Charts</td><td style="padding:4px 0">${chartsCount ?? 0}</td></tr>
          <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5)">Device</td><td style="padding:4px 0;font-size:11px;color:rgba(255,255,255,0.4)">${deviceId || '—'}</td></tr>
        </table>
      </div>
      <div style="text-align:center">
        <a href="https://astrodig.com/admin" style="display:inline-block;background:rgba(201,168,76,0.2);border:1px solid rgba(201,168,76,0.4);border-radius:8px;padding:8px 20px;color:#c9a84c;text-decoration:none;font-size:13px">Open Admin</a>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `✦ New purchase — ${buyerEmail || 'unknown'}`,
      html,
    })
    return { ok: true }
  } catch (err) {
    console.error('[email] owner notification failed:', err)
    return { ok: false, error: err.message }
  }
}
