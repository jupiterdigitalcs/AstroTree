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
    <div style="background:#09071a;padding:0;font-family:'Raleway',Helvetica,Arial,sans-serif;color:#e8dcc8;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden">
      <!-- Header bar -->
      <div style="background:linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(140,80,200,0.08) 100%);border-bottom:1px solid rgba(201,168,76,0.2);padding:24px 32px;text-align:center">
        <p style="font-family:Cinzel,Georgia,serif;color:#c9a84c;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase">✦ AstroDig</p>
        <h1 style="font-family:Cinzel,Georgia,serif;color:#e8dcc8;font-size:22px;margin:0;letter-spacing:0.04em">Welcome to Celestial</h1>
      </div>

      <div style="padding:28px 32px">
        <!-- What's unlocked -->
        <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.18);border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 10px;font-size:14px;color:#c9a84c;font-weight:600">What's now yours:</p>
          <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.9">
            <li>Zodiac Wheel &amp; Constellation views</li>
            <li>Tables — sortable sun, moon &amp; planet grid</li>
            <li>Full Insights — roles, zodiac threads, and deeper analysis</li>
            <li>The complete DIG — every slide in your cosmic story</li>
            <li>Unlimited charts</li>
          </ul>
        </div>

        <!-- How to access -->
        <div style="background:rgba(140,80,200,0.06);border:1px solid rgba(140,80,200,0.15);border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:14px;color:#b8a0d4;font-weight:600">Getting back in</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6">
            Your Celestial access is tied to <strong style="color:#e8dcc8">${to}</strong>. To access your charts and Celestial features on any device, just sign in with this email at <a href="https://astrodig.com" style="color:#c9a84c;text-decoration:none">astrodig.com</a>.
          </p>
        </div>

        ${charts.length > 0 ? `
          <!-- Charts -->
          <div style="margin-bottom:24px">
            <h2 style="font-family:Cinzel,Georgia,serif;color:#e8dcc8;font-size:15px;margin:0 0 12px;letter-spacing:0.04em">Your Charts</h2>
            ${chartSections}
          </div>
        ` : ''}

        <div style="text-align:center;margin:24px 0 8px">
          <a href="https://astrodig.com" style="display:inline-block;background:rgba(201,168,76,0.18);border:1px solid rgba(201,168,76,0.4);border-radius:8px;padding:12px 28px;color:#c9a84c;text-decoration:none;font-family:Cinzel,Georgia,serif;font-size:14px;font-weight:500;letter-spacing:0.06em">Open AstroDig</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid rgba(201,168,76,0.12);padding:16px 32px;text-align:center;background:rgba(0,0,0,0.15)">
        <p style="font-family:Cinzel,Georgia,serif;font-size:10px;color:rgba(201,168,76,0.45);letter-spacing:0.08em;margin:0">✦ AstroDig by Jupiter Digital</p>
        <p style="font-size:10px;color:rgba(255,255,255,0.18);margin:4px 0 0">astrodig.com</p>
      </div>
    </div>
  `

  try {
    console.log(`[email] sending purchase confirmation to ${to}`)
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: '✦ Welcome to AstroDig Celestial — Your Charts Inside',
      html,
    })
    console.log(`[email] purchase confirmation sent to ${to}:`, result)
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

  const amountStr = amount != null ? `$${(amount / 100).toFixed(2)}` : '$9.99'
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
    console.log(`[email] sending owner notification to ${ownerEmail} for buyer ${buyerEmail}`)
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `✦ New purchase — ${buyerEmail || 'unknown'}`,
      html,
    })
    console.log(`[email] owner notification sent to ${ownerEmail}`)
    return { ok: true }
  } catch (err) {
    console.error('[email] owner notification failed:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Send refund confirmation to the buyer.
 */
export async function sendRefundConfirmation({ to }) {
  const resend = getResend()

  const html = `
    <div style="background:#09071a;padding:0;font-family:'Raleway',Helvetica,Arial,sans-serif;color:#e8dcc8;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(140,80,200,0.08) 100%);border-bottom:1px solid rgba(201,168,76,0.2);padding:24px 32px;text-align:center">
        <p style="font-family:Cinzel,Georgia,serif;color:#c9a84c;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase">✦ AstroDig</p>
        <h1 style="font-family:Cinzel,Georgia,serif;color:#e8dcc8;font-size:22px;margin:0;letter-spacing:0.04em">Your Refund Has Been Processed</h1>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;margin:0 0 16px">
          Your Celestial purchase has been refunded. The charge will be reversed on your statement within 5–10 business days.
        </p>
        <p style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;margin:0 0 16px">
          Your account has been moved back to the free tier. Your saved charts and members are still there — you just won't have access to Celestial features.
        </p>
        <p style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;margin:0">
          If you change your mind, you can upgrade again anytime at <a href="https://astrodig.com" style="color:#c9a84c;text-decoration:none">astrodig.com</a>.
        </p>
      </div>
      <div style="border-top:1px solid rgba(201,168,76,0.12);padding:16px 32px;text-align:center;background:rgba(0,0,0,0.15)">
        <p style="font-family:Cinzel,Georgia,serif;font-size:10px;color:rgba(201,168,76,0.45);letter-spacing:0.08em;margin:0">✦ AstroDig by Jupiter Digital</p>
        <p style="font-size:10px;color:rgba(255,255,255,0.18);margin:4px 0 0">astrodig.com</p>
      </div>
    </div>
  `

  try {
    console.log(`[email] sending refund confirmation to ${to}`)
    await resend.emails.send({ from: FROM, to, subject: 'Your AstroDig refund has been processed', html })
    console.log(`[email] refund confirmation sent to ${to}`)
    return { ok: true }
  } catch (err) {
    console.error('[email] refund confirmation failed:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Notify the site owner of a refund.
 */
export async function sendOwnerRefundNotification({ buyerEmail, deviceId }) {
  const resend = getResend()
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) return { ok: false, error: 'OWNER_EMAIL not configured' }

  const html = `
    <div style="background:#09071a;padding:32px;font-family:'Raleway',Helvetica,Arial,sans-serif;color:#e8dcc8;max-width:500px;margin:0 auto">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="font-family:Cinzel,Georgia,serif;color:#e87070;font-size:22px;margin:0">Refund Processed</h1>
      </div>
      <div style="background:rgba(232,112,112,0.08);border:1px solid rgba(232,112,112,0.2);border-radius:8px;padding:16px;margin-bottom:16px">
        <table style="width:100%;font-size:14px;color:#e8dcc8">
          <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5)">Buyer</td><td style="padding:4px 0">${buyerEmail || 'No email on file'}</td></tr>
          <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5)">Device</td><td style="padding:4px 0;font-size:11px;color:rgba(255,255,255,0.4)">${deviceId || '—'}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);text-align:center">Account downgraded to free tier.</p>
    </div>
  `

  try {
    await resend.emails.send({ from: FROM, to: ownerEmail, subject: `Refund — ${buyerEmail || 'unknown'}`, html })
    return { ok: true }
  } catch (err) {
    console.error('[email] owner refund notification failed:', err)
    return { ok: false, error: err.message }
  }
}
