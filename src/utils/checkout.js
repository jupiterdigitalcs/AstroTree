import { getDeviceId } from './identity.js'

// Start a Stripe Checkout session and redirect to payment page
export async function startCheckout(productKey, metadata = {}) {
  const res = await fetch('/api/stripe?action=create-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify({ productKey, metadata }),
  })

  const data = await res.json()
  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? 'Failed to start checkout' }
  }

  // Redirect to Stripe Checkout
  window.location.href = data.url
  return { ok: true }
}

// Check if the user just returned from a purchase
export function checkPurchaseReturn() {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('purchase')
  if (status) {
    // Clean the URL without triggering a reload
    const url = new URL(window.location)
    url.searchParams.delete('purchase')
    window.history.replaceState({}, '', url)
  }
  return status // 'success' | 'cancelled' | null
}
