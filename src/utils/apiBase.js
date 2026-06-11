// Single place the client learns where its API lives.
// On the website this is '' (same-origin /api/... calls). A future native
// (iOS) build ships the UI as bundled files with no same-origin server, so
// it sets NEXT_PUBLIC_API_BASE=https://astrodig.com at build time and every
// call goes through here unchanged.
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

export function apiUrl(path) {
  return `${BASE}${path}`
}
