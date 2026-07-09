import { useState, useMemo, useRef, useEffect } from 'react'
import { DateInput } from './DateInput.jsx'
import { PlanetSign } from './PlanetSign.jsx'

// City/state → IANA timezone lookup.
// Each entry has an array of search terms (all lowercase, full words/phrases).
// Matching: a term hits if the query contains the term OR the term contains the query.
// Terms should be specific enough to avoid false matches (no single common words).
const CITY_TZ_ALIASES = [
  // ── Pacific (America/Los_Angeles) ────────────────────────────────────────
  {
    tz: 'America/Los_Angeles', label: 'Pacific Time',
    search: [
      'california', 'los angeles', 'san diego', 'san francisco', 'san jose',
      'sacramento', 'fresno', 'long beach', 'oakland', 'bakersfield',
      'anaheim', 'santa ana', 'riverside', 'stockton', 'irvine',
      'chula vista', 'fremont', 'san bernardino', 'modesto', 'fontana',
      'moreno valley', 'glendale', 'huntington beach', 'santa clarita',
      'garden grove', 'oceanside', 'oxnard', 'ontario', 'rancho cucamonga',
      'elk grove', 'corona', 'hayward', 'salinas', 'pomona', 'escondido',
      'sunnyvale', 'torrance', 'pasadena', 'orange', 'fullerton',
      'thousand oaks', 'visalia', 'santa rosa', 'concord', 'simi valley',
      'vallejo', 'berkeley', 'el monte', 'downey', 'miramar',
      'washington state', 'seattle', 'spokane', 'tacoma', 'bellevue',
      'kent', 'everett', 'renton', 'olympia', 'bellingham',
      'oregon', 'portland', 'eugene', 'salem', 'gresham', 'hillsboro',
      'nevada', 'las vegas', 'henderson', 'reno', 'north las vegas',
    ],
  },
  // ── Arizona / no DST (America/Phoenix) ───────────────────────────────────
  {
    tz: 'America/Phoenix', label: 'Arizona (Mountain, no DST)',
    search: [
      'arizona', 'phoenix', 'tucson', 'mesa', 'chandler', 'scottsdale',
      'tempe', 'gilbert', 'glendale', 'flagstaff', 'peoria', 'surprise',
      'yuma', 'avondale', 'goodyear', 'sedona', 'prescott',
    ],
  },
  // ── Mountain (America/Denver) ─────────────────────────────────────────────
  {
    tz: 'America/Denver', label: 'Mountain Time',
    search: [
      'colorado', 'denver', 'colorado springs', 'aurora', 'fort collins',
      'lakewood', 'thornton', 'arvada', 'westminster', 'boulder',
      'pueblo', 'highlands ranch', 'centennial', 'greeley', 'longmont',
      'utah', 'salt lake city', 'salt lake', 'west valley city', 'provo',
      'west jordan', 'orem', 'sandy', 'ogden', 'st george', 'layton',
      'new mexico', 'albuquerque', 'las cruces', 'santa fe', 'rio rancho',
      'wyoming', 'cheyenne', 'casper', 'laramie',
      'montana', 'billings', 'missoula', 'great falls', 'bozeman',
      'idaho', 'boise', 'nampa', 'meridian', 'idaho falls', 'pocatello',
    ],
  },
  // ── Central (America/Chicago) ─────────────────────────────────────────────
  {
    tz: 'America/Chicago', label: 'Central Time',
    search: [
      'texas', 'houston', 'dallas', 'san antonio', 'austin', 'fort worth',
      'el paso', 'arlington', 'corpus christi', 'plano', 'lubbock',
      'laredo', 'irving', 'garland', 'amarillo', 'mckinney', 'frisco',
      'illinois', 'chicago', 'aurora', 'joliet', 'naperville', 'rockford',
      'springfield', 'elgin', 'peoria', 'champaign',
      'minnesota', 'minneapolis', 'saint paul', 'st paul', 'rochester',
      'duluth', 'bloomington',
      'wisconsin', 'milwaukee', 'madison', 'green bay', 'kenosha', 'racine',
      'iowa', 'des moines', 'cedar rapids', 'davenport', 'sioux city',
      'missouri', 'kansas city', 'saint louis', 'st louis', 'springfield',
      'independence', 'columbia',
      'kansas', 'wichita', 'overland park', 'topeka', 'olathe',
      'nebraska', 'omaha', 'lincoln', 'bellevue',
      'oklahoma', 'oklahoma city', 'tulsa', 'norman', 'broken arrow',
      'louisiana', 'new orleans', 'baton rouge', 'shreveport', 'lafayette',
      'arkansas', 'little rock', 'fort smith', 'fayetteville',
      'mississippi', 'jackson', 'gulfport', 'biloxi',
      'alabama', 'birmingham', 'montgomery', 'huntsville', 'mobile',
      'tennessee', 'nashville', 'memphis', 'knoxville', 'chattanooga',
      'south dakota', 'sioux falls', 'rapid city',
      'north dakota', 'fargo', 'bismarck', 'grand forks',
    ],
  },
  // ── Eastern (America/New_York) ────────────────────────────────────────────
  {
    tz: 'America/New_York', label: 'Eastern Time',
    search: [
      'new york', 'new york city', 'nyc', 'brooklyn', 'queens', 'bronx',
      'manhattan', 'staten island', 'buffalo', 'rochester', 'yonkers',
      'syracuse', 'albany', 'new rochelle', 'mount vernon',
      'new jersey', 'newark', 'jersey city', 'paterson', 'elizabeth',
      'trenton', 'camden', 'clifton', 'toms river', 'new brunswick',
      'hackensack', 'hoboken', 'east orange', 'parsippany', 'woodbridge',
      'pennsylvania', 'philadelphia', 'pittsburgh', 'allentown', 'erie',
      'reading', 'scranton', 'bethlehem', 'lancaster', 'harrisburg',
      'massachusetts', 'boston', 'worcester', 'springfield', 'cambridge',
      'lowell', 'brockton', 'quincy', 'lynn', 'fall river',
      'connecticut', 'bridgeport', 'new haven', 'hartford', 'stamford',
      'rhode island', 'providence', 'cranston', 'warwick',
      'new hampshire', 'manchester', 'nashua', 'concord',
      'vermont', 'burlington', 'montpelier',
      'maine', 'portland', 'lewiston', 'bangor',
      'maryland', 'baltimore', 'columbia', 'germantown', 'silver spring',
      'annapolis', 'rockville',
      'washington dc', 'district of columbia',
      'virginia', 'virginia beach', 'chesapeake', 'norfolk', 'richmond',
      'arlington', 'alexandria', 'roanoke',
      'north carolina', 'charlotte', 'raleigh', 'greensboro', 'durham',
      'winston-salem', 'fayetteville', 'cary', 'wilmington', 'high point',
      'south carolina', 'columbia', 'charleston', 'north charleston',
      'mount pleasant', 'rock hill', 'greenville',
      'georgia', 'atlanta', 'columbus', 'savannah', 'athens',
      'florida', 'miami', 'jacksonville', 'tampa', 'orlando', 'st petersburg',
      'hialeah', 'tallahassee', 'fort lauderdale', 'pembroke pines',
      'cape coral', 'hollywood', 'gainesville', 'miramar', 'coral springs',
      'west virginia', 'charleston', 'huntington', 'morgantown',
      'delaware', 'wilmington', 'dover',
      'michigan', 'detroit', 'grand rapids', 'warren', 'sterling heights',
      'lansing', 'ann arbor', 'flint',
      'ohio', 'columbus', 'cleveland', 'cincinnati', 'toledo', 'akron',
      'dayton', 'parma',
      'kentucky', 'louisville', 'lexington', 'bowling green',
      'indiana', 'indianapolis', 'fort wayne', 'evansville', 'south bend',
    ],
  },
  // ── Indiana exceptions ────────────────────────────────────────────────────
  {
    tz: 'America/Indiana/Indianapolis', label: 'Indiana (Eastern)',
    search: ['indiana', 'indianapolis', 'fort wayne', 'evansville', 'south bend', 'gary'],
  },
  // ── Alaska ───────────────────────────────────────────────────────────────
  {
    tz: 'America/Anchorage', label: 'Alaska',
    search: ['alaska', 'anchorage', 'fairbanks', 'juneau', 'sitka'],
  },
  // ── Hawaii ───────────────────────────────────────────────────────────────
  {
    tz: 'Pacific/Honolulu', label: 'Hawaii',
    search: ['hawaii', 'honolulu', 'maui', 'hilo', 'kailua', 'oahu', 'kauai'],
  },
  // ── Canada ───────────────────────────────────────────────────────────────
  {
    tz: 'America/Toronto', label: 'Eastern Canada',
    search: ['ontario', 'toronto', 'ottawa', 'mississauga', 'brampton',
      'hamilton', 'london ontario', 'quebec', 'montreal', 'laval',
      'gatineau', 'longueuil'],
  },
  {
    tz: 'America/Vancouver', label: 'Pacific Canada',
    search: ['british columbia', 'vancouver', 'surrey', 'burnaby', 'richmond',
      'kelowna', 'abbotsford'],
  },
  {
    tz: 'America/Edmonton', label: 'Mountain Canada',
    search: ['alberta', 'calgary', 'edmonton', 'red deer', 'lethbridge'],
  },
  {
    tz: 'America/Winnipeg', label: 'Central Canada',
    search: ['manitoba', 'winnipeg', 'brandon', 'saskatchewan', 'regina', 'saskatoon'],
  },
  {
    tz: 'America/Halifax', label: 'Atlantic Canada',
    search: ['nova scotia', 'halifax', 'new brunswick canada', 'moncton',
      'fredericton', 'prince edward island', 'charlottetown'],
  },
  // ── UK / Europe ───────────────────────────────────────────────────────────
  { tz: 'Europe/London',    label: 'United Kingdom',  search: ['uk', 'united kingdom', 'england', 'london', 'manchester', 'birmingham', 'glasgow', 'liverpool', 'wales', 'scotland', 'ireland', 'dublin'] },
  { tz: 'Europe/Paris',     label: 'France',          search: ['france', 'paris', 'lyon', 'marseille', 'toulouse', 'nice'] },
  { tz: 'Europe/Berlin',    label: 'Germany',         search: ['germany', 'berlin', 'hamburg', 'munich', 'cologne', 'frankfurt', 'stuttgart'] },
  { tz: 'Europe/Rome',      label: 'Italy',           search: ['italy', 'rome', 'milan', 'naples', 'turin', 'florence', 'venice'] },
  { tz: 'Europe/Madrid',    label: 'Spain',           search: ['spain', 'madrid', 'barcelona', 'valencia', 'seville'] },
  { tz: 'Europe/Amsterdam', label: 'Netherlands',     search: ['netherlands', 'amsterdam', 'rotterdam', 'the hague', 'utrecht'] },
  { tz: 'Europe/Athens',    label: 'Greece',          search: ['greece', 'athens', 'thessaloniki'] },
  { tz: 'Europe/Warsaw',    label: 'Poland',          search: ['poland', 'warsaw', 'krakow', 'lodz', 'wroclaw'] },
  { tz: 'Europe/Stockholm', label: 'Sweden',          search: ['sweden', 'stockholm', 'gothenburg', 'malmo'] },
  { tz: 'Europe/Bucharest', label: 'Romania',         search: ['romania', 'bucharest'] },
  { tz: 'Europe/Kiev',      label: 'Ukraine',         search: ['ukraine', 'kyiv', 'kiev', 'kharkiv', 'odessa'] },
  { tz: 'Europe/Moscow',    label: 'Moscow',          search: ['russia', 'moscow', 'saint petersburg'] },
  // ── Asia ──────────────────────────────────────────────────────────────────
  { tz: 'Asia/Tokyo',       label: 'Japan',           search: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya'] },
  { tz: 'Asia/Seoul',       label: 'South Korea',     search: ['south korea', 'korea', 'seoul', 'busan', 'incheon'] },
  { tz: 'Asia/Shanghai',    label: 'China',           search: ['china', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu'] },
  { tz: 'Asia/Hong_Kong',   label: 'Hong Kong',       search: ['hong kong'] },
  { tz: 'Asia/Singapore',   label: 'Singapore',       search: ['singapore'] },
  { tz: 'Asia/Kolkata',     label: 'India',           search: ['india', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'kolkata', 'chennai', 'pune'] },
  { tz: 'Asia/Dubai',       label: 'UAE / Dubai',     search: ['dubai', 'abu dhabi', 'uae', 'united arab emirates'] },
  { tz: 'Asia/Bangkok',     label: 'Thailand',        search: ['thailand', 'bangkok', 'chiang mai'] },
  { tz: 'Asia/Manila',      label: 'Philippines',     search: ['philippines', 'manila', 'quezon city', 'cebu'] },
  { tz: 'Asia/Jakarta',     label: 'Indonesia',       search: ['indonesia', 'jakarta', 'bali', 'surabaya'] },
  { tz: 'Asia/Karachi',     label: 'Pakistan',        search: ['pakistan', 'karachi', 'lahore', 'islamabad'] },
  // ── Latin America ─────────────────────────────────────────────────────────
  { tz: 'America/Mexico_City', label: 'Mexico (Central)', search: ['mexico', 'mexico city', 'guadalajara', 'monterrey', 'puebla', 'tijuana'] },
  { tz: 'America/Sao_Paulo',   label: 'Brazil (Brasília)', search: ['brazil', 'sao paulo', 'rio de janeiro', 'brasilia', 'salvador', 'fortaleza'] },
  { tz: 'America/Argentina/Buenos_Aires', label: 'Argentina', search: ['argentina', 'buenos aires', 'cordoba', 'rosario'] },
  { tz: 'America/Bogota',      label: 'Colombia',    search: ['colombia', 'bogota', 'medellin', 'cali'] },
  { tz: 'America/Lima',        label: 'Peru',        search: ['peru', 'lima'] },
  { tz: 'America/Santiago',    label: 'Chile',       search: ['chile', 'santiago'] },
  // ── Australia / NZ ────────────────────────────────────────────────────────
  { tz: 'Australia/Sydney',    label: 'Sydney / Melbourne (AEST)', search: ['new south wales', 'victoria', 'sydney', 'melbourne', 'canberra', 'newcastle', 'wollongong'] },
  { tz: 'Australia/Brisbane',  label: 'Brisbane / Queensland',     search: ['queensland', 'brisbane', 'gold coast', 'sunshine coast', 'cairns', 'townsville'] },
  { tz: 'Australia/Perth',     label: 'Perth / Western Australia', search: ['western australia', 'perth'] },
  { tz: 'Australia/Adelaide',  label: 'Adelaide / South Australia',search: ['south australia', 'adelaide'] },
  { tz: 'Pacific/Auckland',    label: 'New Zealand',               search: ['new zealand', 'auckland', 'wellington', 'christchurch'] },
  // ── Africa / Middle East ──────────────────────────────────────────────────
  { tz: 'Africa/Cairo',        label: 'Egypt',       search: ['egypt', 'cairo', 'alexandria'] },
  { tz: 'Africa/Johannesburg', label: 'South Africa',search: ['south africa', 'johannesburg', 'cape town', 'durban', 'pretoria'] },
  { tz: 'Africa/Lagos',        label: 'Nigeria',     search: ['nigeria', 'lagos', 'abuja', 'kano'] },
  { tz: 'Africa/Nairobi',      label: 'Kenya',       search: ['kenya', 'nairobi'] },
]

function searchTimezones(q) {
  const ql = q.toLowerCase().trim()
  if (ql.length < 2) return []

  // Match: query is contained in term, OR term is contained in query (min 3 chars to prevent noise)
  const aliasHits = CITY_TZ_ALIASES
    .filter(entry => entry.search.some(term =>
      term.includes(ql) || (ql.length >= 3 && ql.includes(term))
    ))
    .map(entry => ({ tz: entry.tz, label: entry.label, isAlias: true }))

  // Also search IANA names directly
  let all = []
  try { all = Intl.supportedValuesOf('timeZone') } catch { return aliasHits }
  const qNorm = ql.replace(/\s+/g, '_')
  const ianaHits = all
    .filter(tz => tz.toLowerCase().includes(qNorm))
    .slice(0, 15)
    .map(tz => ({ tz, label: null, isAlias: false }))

  // Merge, dedupe by tz
  const seen = new Set(aliasHits.map(a => a.tz))
  const merged = [...aliasHits]
  for (const h of ianaHits) {
    if (!seen.has(h.tz)) { merged.push(h); seen.add(h.tz) }
  }
  return merged.slice(0, 20)
}

// Convert stored 24h "HH:MM" → 12h display + AM/PM
function to12h(time24) {
  if (!time24 || !/^\d{2}:\d{2}$/.test(time24)) return { display: '', ampm: 'AM' }
  let [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return { display: `${h}:${m.toString().padStart(2, '0')}`, ampm }
}

// Parse "h:mm" or raw digits + AM/PM → 24h "HH:MM", or null if invalid
function to24h(timeStr, ampm) {
  const digits = timeStr.replace(/\D/g, '')
  if (digits.length < 3 || digits.length > 4) return null
  const h   = parseInt(digits.length === 4 ? digits.slice(0, 2) : digits[0])
  const min = parseInt(digits.length === 4 ? digits.slice(2) : digits.slice(1))
  if (h < 1 || h > 12 || min < 0 || min > 59) return null
  let h24 = h
  if (ampm === 'PM' && h !== 12) h24 += 12
  if (ampm === 'AM' && h === 12) h24 = 0
  return `${h24.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

export default function EditMemberPanel({
  node,
  allNodes,
  edges,
  onUpdate,
  onDelete,
  onAddEdge,
  onRemoveEdge,
  onCancel,
  onGoToInsights,
  onGoToView,
  onViewProfile,
  viewLabel,
}) {
  const [name,           setName]           = useState(node.data.name)
  const [birthdate,      setBirthdate]      = useState(node.data.birthdate)
  const [exactBirthTime, setExactBirthTime] = useState(node.data.exactBirthTime ?? false)

  const { display: initDisplay, ampm: initAmPm } = to12h(node.data.birthTime ?? '')
  const [birthTimeInput, setBirthTimeInput] = useState(initDisplay)
  const [birthTimeAmPm,  setBirthTimeAmPm]  = useState(initAmPm)

  // Derived 24h time used for ingress warnings and saving
  const birthTime = birthTimeInput ? (to24h(birthTimeInput, birthTimeAmPm) ?? '') : ''
  const [error,          setError]          = useState('')

  // Ingress warnings from precomputed node data
  const originalWarnings = node.data?.ingressWarnings ?? []
  // Active warnings — clear when birth time is entered (resolves ambiguity)
  const ingressWarnings = birthTime ? [] : originalWarnings

  // Show exact-time checkbox when birth time is a round hour near a sign change
  const showExactCheckbox = useMemo(() => {
    if (!birthTime || !originalWarnings.length) return false
    const [h, m] = birthTime.split(':').map(Number)
    if (m !== 0) return false
    return originalWarnings.some(w => Math.abs(h - w.ingressHour) <= 1)
  }, [birthTime, originalWarnings])
  const [showBirthTime, setShowBirthTime] = useState(true) // always show — timezone is always visible
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showDetails,   setShowDetails]   = useState(false) // collapsed in first-connect mode
  const [connectTo,     setConnectTo]     = useState(null) // id of node being connected

  // Timezone
  const [birthTimezone,   setBirthTimezone]   = useState(node.data.birthTimezone ?? null)
  const [tzSearch,        setTzSearch]        = useState('')
  const [showTzPicker,    setShowTzPicker]    = useState(false)
  const [tzConfirmed,     setTzConfirmed]     = useState(false) // dismiss tz warning after user opens picker
  const timezoneWarnings = node.data?.timezoneWarnings ?? []
  const hasTzWarnings = timezoneWarnings.length > 0 && !tzConfirmed
  const [showTzSection, setShowTzSection] = useState(!!birthTimezone || timezoneWarnings.length > 0)
  const [connSearch,    setConnSearch]    = useState('')
  const [savedFlash,    setSavedFlash]    = useState(false)
  const savedTimerRef = useRef(null)
  const connSectionRef = useRef(null)

  function showSaved() {
    clearTimeout(savedTimerRef.current)
    setSavedFlash(true)
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 2000)
  }

  function doSave(overrides = {}) {
    const n  = (overrides.name      !== undefined ? overrides.name      : name).trim()
    const bd = overrides.birthdate  !== undefined ? overrides.birthdate  : birthdate
    if (!n || !bd) return
    const bt  = overrides.birthTime      !== undefined ? overrides.birthTime      : (birthTime || null)
    const ebt = overrides.exactBirthTime !== undefined ? overrides.exactBirthTime : exactBirthTime
    const btz = overrides.birthTimezone  !== undefined ? overrides.birthTimezone  : birthTimezone
    onUpdate(node.id, { name: n, birthdate: bd, birthTime: bt, exactBirthTime: ebt, birthTimezone: btz }, { keepOpen: true })
    showSaved()
  }

  // ── Derive connections fresh from props every render ──────────────────────
  const parentEdges = edges.filter(e => e.target === node.id && e.data?.relationType === 'parent-child')
  const childEdges  = edges.filter(e => e.source === node.id && e.data?.relationType === 'parent-child')
  const stepParentEdges = edges.filter(e => e.target === node.id && e.data?.relationType === 'step-parent')
  const stepChildEdges  = edges.filter(e => e.source === node.id && e.data?.relationType === 'step-parent')
  const spouseEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'spouse'
  )
  const friendEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'friend'
  )
  const siblingEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'sibling'
  )
  const coworkerEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'coworker'
  )

  // Already connected node IDs
  const connectedIds = new Set([node.id])
  edges.forEach(e => {
    if (e.source === node.id) connectedIds.add(e.target)
    if (e.target === node.id) connectedIds.add(e.source)
  })
  const eligibleNodes = allNodes
    .filter(n => !connectedIds.has(n.id))
    .sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999'))

  // ── Ancestor / descendant sets (for preventing impossible relationships) ──
  const ancestors = new Set()
  const descendants = new Set()
  function walkUp(id) {
    edges.forEach(e => {
      if (e.target === id && e.data?.relationType === 'parent-child' && !ancestors.has(e.source)) {
        ancestors.add(e.source)
        walkUp(e.source)
      }
    })
  }
  function walkDown(id) {
    edges.forEach(e => {
      if (e.source === id && e.data?.relationType === 'parent-child' && !descendants.has(e.target)) {
        descendants.add(e.target)
        walkDown(e.target)
      }
    })
  }
  walkUp(node.id)
  walkDown(node.id)

  // How many parents does a given node have?
  function parentCountOf(nodeId) {
    return edges.filter(e => e.target === nodeId && e.data?.relationType === 'parent-child').length
  }

  // ── Compute valid relationship types for a specific other node ────────────
  function getValidRelationships(otherId) {
    const family = []
    const other  = []

    // Parent: only if current member has < 2 parents, and other is not a descendant
    if (parentEdges.length < 2 && !descendants.has(otherId)) {
      family.push({ key: 'parent', label: 'Parent', action: () => addConn(otherId, node.id) })
    }

    // Child: only if other has < 2 parents, and other is not an ancestor
    if (parentCountOf(otherId) < 2 && !ancestors.has(otherId)) {
      family.push({ key: 'child', label: 'Child', action: () => addConn(node.id, otherId) })
    }

    // Sibling: always valid (non-hierarchical, no parent needed)
    family.push({ key: 'sibling', label: 'Sibling', action: () => addConn(node.id, otherId, 'sibling') })

    // Spouse: deprioritize if this node already has a partner
    const spouseEntry = { key: 'spouse', label: 'Partner', action: () => addConn(node.id, otherId, 'spouse') }
    if (spouseEdges.length === 0) {
      family.push(spouseEntry)
    } else {
      other.push(spouseEntry)
    }

    // Step-parent / step-child: less common, push to other
    other.push({ key: 'step-parent', label: 'Step-Parent', action: () => addConn(otherId, node.id, 'step-parent') })
    other.push({ key: 'step-child', label: 'Step-Child', action: () => addConn(node.id, otherId, 'step-parent') })

    // Friend + coworker
    other.push({ key: 'friend', label: 'Friend', action: () => addConn(node.id, otherId, 'friend') })
    other.push({ key: 'coworker', label: 'Coworker', action: () => addConn(node.id, otherId, 'coworker') })

    // Insert separator between groups
    if (family.length > 0 && other.length > 0) {
      return [...family, { key: '_sep', separator: true }, ...other]
    }
    return [...family, ...other]
  }

  // ── Partner-children suggestion ───────────────────────────────────────────
  const myChildIds = new Set(childEdges.map(e => e.target))
  const partnerChildSuggestions = spouseEdges.flatMap(spouseEdge => {
    const partnerId  = spouseEdge.source === node.id ? spouseEdge.target : spouseEdge.source
    const partner    = allNodes.find(n => n.id === partnerId)
    if (!partner) return []
    return edges
      .filter(e => e.source === partnerId && e.data?.relationType === 'parent-child' && !myChildIds.has(e.target) && e.target !== node.id)
      .map(e => ({ partner, childId: e.target, childNode: allNodes.find(n => n.id === e.target) }))
      .filter(s => s.childNode)
  })

  function addConn(src, tgt, type) {
    onAddEdge(src, tgt, type)
    showSaved()
  }

  function removeConn(edgeId) {
    onRemoveEdge(edgeId)
    showSaved()
  }

  function handleConnect(otherId) {
    const types = getValidRelationships(otherId)
    if (types.length === 1) {
      // Only one option — just do it
      types[0].action()
      setConnectTo(null)
    } else {
      setConnectTo(otherId)
    }
  }

  const connectTarget = connectTo ? allNodes.find(n => n.id === connectTo) : null
  const connectOptions = connectTo ? getValidRelationships(connectTo) : []

  // If selected node got connected (no longer eligible), reset
  if (connectTo && connectedIds.has(connectTo)) {
    // will reset on next render via the effect below
    setTimeout(() => setConnectTo(null), 0)
  }

  const hasConnections = parentEdges.length > 0 || childEdges.length > 0 ||
                         stepParentEdges.length > 0 || stepChildEdges.length > 0 ||
                         siblingEdges.length > 0 || spouseEdges.length > 0 ||
                         friendEdges.length > 0 || coworkerEdges.length > 0 ||
                         eligibleNodes.length > 0
  const isFirstConnect = edges.length === 0 && eligibleNodes.length > 0

  // Auto-scroll to connections section when this is the first connect opportunity
  useEffect(() => {
    if (isFirstConnect && connSectionRef.current) {
      const timer = setTimeout(() => {
        connSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isFirstConnect])

  return (
    <div className="add-form edit-panel">
      <div className="edit-panel-title-row">
        <h2 className="form-title">✦ {node.data.name || 'Edit Member'}</h2>
      </div>
      {savedFlash && <div className="edit-saved-toast" key={Date.now()}>✓ Changes saved</div>}

      {/* In first-connect mode, collapse name/date into a compact summary */}
      {isFirstConnect && !showDetails ? (
        <div className="edit-compact-summary">
          <span className="edit-compact-info">
            {node.data.symbol} {node.data.name}
            {node.data.birthdate && <span className="edit-compact-date"> · {node.data.birthdate}</span>}
          </span>
          <button type="button" className="edit-compact-expand" onClick={() => setShowDetails(true)}>Edit</button>
        </div>
      ) : (
      <>
      <div className="name-date-row">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => doSave()}
          />
        </label>

        <label>
          Birthdate
          <DateInput value={birthdate} onChange={v => { setBirthdate(v); if (v && name.trim()) doSave({ birthdate: v }) }} />
        </label>
      </div>

      {/* ── Birth time + timezone (collapsible, same row) ──────────────── */}
      {!showBirthTime && !showTzSection ? (
        <button type="button" className="birthtime-expand-btn" onClick={() => { setShowBirthTime(true); setShowTzSection(true) }}>
          + Add birth time / timezone <span className="birthtime-optional">(optional)</span>
        </button>
      ) : (
        <>
          <div className="birthtime-tz-row">
            <div className="birthtime-field">
              <div className="birthtime-field-header">
                <span className="birthtime-field-label">Time</span>
                {birthTimeInput && (
                  <button
                    type="button"
                    className="birthtime-clear-btn"
                    onClick={() => { setBirthTimeInput(''); setBirthTimeAmPm('AM'); setExactBirthTime(false); doSave({ birthTime: null, exactBirthTime: false }) }}
                  >Clear</button>
                )}
              </div>
              <div className="birthtime-row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="row-input birthtime-input"
                  placeholder="HH:MM"
                  value={birthTimeInput}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                    let formatted = digits
                    if (digits.length >= 3) formatted = digits.slice(0, -2) + ':' + digits.slice(-2)
                    else if (digits.length === 2 && birthTimeInput.length < e.target.value.length) formatted = digits + ':'
                    setBirthTimeInput(formatted)
                    setExactBirthTime(false)
                  }}
                  onBlur={() => {
                    if (!birthTimeInput) { doSave({ birthTime: null }); return }
                    const t24 = to24h(birthTimeInput, birthTimeAmPm)
                    if (!t24) { setBirthTimeInput(''); doSave({ birthTime: null }) }
                    else {
                      const { display } = to12h(t24)
                      setBirthTimeInput(display)
                      doSave({ birthTime: t24 })
                    }
                  }}
                />
                <div className="birthtime-ampm-pills">
                  {['AM', 'PM'].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`birthtime-ampm-pill${birthTimeAmPm === v ? ' active' : ''}`}
                      onClick={() => {
                        setBirthTimeAmPm(v)
                        const t24 = to24h(birthTimeInput, v)
                        if (t24) doSave({ birthTime: t24 })
                      }}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="tz-field">
              <div className="birthtime-field-header">
                <span className="birthtime-field-label">Timezone</span>
              </div>
              <button type="button" className={`tz-select-btn${hasTzWarnings ? ' tz-select-btn--warn' : ''}`} onClick={() => { setShowTzPicker(!showTzPicker); setTzConfirmed(true) }}>
                <span className="tz-select-value">{birthTimezone ? birthTimezone.split('/').pop().replace(/_/g, ' ') : 'New York'}</span>
                <span className="tz-select-arrow">▾</span>
              </button>
            </div>
          </div>

          {/* Timezone picker dropdown — only when open */}
          {showTzPicker && (
            <div className="tz-picker-dropdown">
              <input
                type="text"
                className="row-input tz-search-input"
                placeholder="Search timezone..."
                value={tzSearch}
                onChange={e => setTzSearch(e.target.value)}
                autoFocus
              />
              {(() => {
                const browser = Intl.DateTimeFormat().resolvedOptions().timeZone
                return (
                  <button
                    type="button"
                    className="tz-quick-btn"
                    onClick={() => { setBirthTimezone(browser); setTzSearch(''); setShowTzPicker(false); doSave({ birthTimezone: browser }) }}
                  >
                    Use my timezone ({browser.replace(/_/g, ' ')})
                  </button>
                )
              })()}
              <div className="tz-results">
                {(() => {
                  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
                  if (!tzSearch.trim()) {
                    // No query — show a helpful prompt
                    return (
                      <p className="tz-results-hint">Type a city or region name</p>
                    )
                  }
                  const results = searchTimezones(tzSearch)
                  if (!results.length) return <p className="tz-results-hint">No matches, try a nearby city</p>
                  return results.map(({ tz, label, isAlias }) => (
                    <button
                      key={tz + (label ?? '')}
                      type="button"
                      className={`tz-option${tz === birthTimezone ? ' tz-option--selected' : ''}${tz === browserTz ? ' tz-option--detected' : ''}`}
                      onClick={() => { setBirthTimezone(tz); setTzSearch(''); setShowTzPicker(false); doSave({ birthTimezone: tz }) }}
                    >
                      <span className="tz-option-label">
                        {isAlias ? label : tz.replace(/_/g, ' ').replace(/\//g, ' / ')}
                      </span>
                      <span className="tz-option-id">
                        {tz.replace(/_/g, ' ')}
                        {tz === browserTz ? ' · detected' : ''}
                      </span>
                    </button>
                  ))
                })()}
              </div>
            </div>
          )}

          {/* Combined sign accuracy warnings — time ingress + timezone sensitivity */}
          {(hasTzWarnings || originalWarnings.length > 0) && (
            <div className={`ingress-context${birthTime && !ingressWarnings.length && !hasTzWarnings ? ' ingress-context--resolved' : ''}`}>
              {birthTime && !ingressWarnings.length && !hasTzWarnings ? (
                <span className="ingress-context-ok">✓ Signs confirmed</span>
              ) : (
                <>
                  {hasTzWarnings && (
                    <span className="ingress-context-note">
                      Timezone-sensitive, verify timezone is correct for birth location
                    </span>
                  )}
                  {ingressWarnings.length > 0 && (
                    <span className="ingress-context-note">
                      {originalWarnings.length === 1
                        ? `${originalWarnings[0].name} changes sign on this date, birth time helps confirm`
                        : `${originalWarnings.length} planets change sign on this date, birth time helps confirm`}
                    </span>
                  )}
                  {hasTzWarnings && timezoneWarnings.map(w => (
                    <span key={`tz-${w.planet}`} className="ingress-warning-planet">
                      <span>{w.glyph}</span>
                      <span>{w.signWest}</span>
                      <span className="ingress-warning-arrow">or</span>
                      <span>{w.signEast}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>(timezone)</span>
                    </span>
                  ))}
                  {ingressWarnings.length > 0 && originalWarnings.map(w => (
                    <span key={`ig-${w.name}`} className="ingress-warning-planet">
                      <PlanetSign planet={w.planet} sign={w.signStart} />
                      <span className="ingress-warning-arrow">→</span>
                      <PlanetSign planet={w.planet} sign={w.signEnd} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                        ({w.ingressTime})
                      </span>
                    </span>
                  ))}
                </>
              )}
              {showExactCheckbox && (
                <label className="birthtime-exact-label">
                  <input
                    type="checkbox"
                    checked={exactBirthTime}
                    onChange={e => { setExactBirthTime(e.target.checked); doSave({ exactBirthTime: e.target.checked }) }}
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  This time is exact
                  <span className="ingress-warning-note" style={{ fontStyle: 'normal' }}>
                    (Round number near a sign change, confirm from records if unsure)
                  </span>
                </label>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      </>
      )}

      {/* ── Connections ─────────────────────────────────────────────────── */}
      {hasConnections && (
        <div className={`connections-section${isFirstConnect ? ' connections-section--highlight' : ''}`} ref={connSectionRef}>
          {isFirstConnect ? (
            <span className="conn-first-prompt">Connect {node.data.name}, tap a name below</span>
          ) : (
            <span className="parent-select-label">Connections</span>
          )}

          {parentEdges.length > 0 && (
            <ConnGroup label="Parents" edgeList={parentEdges}
              getOther={e => e.source} allNodes={allNodes} onRemove={removeConn} />
          )}
          {childEdges.length > 0 && (
            <ConnGroup label="Children" edgeList={childEdges}
              getOther={e => e.target} allNodes={allNodes} onRemove={removeConn} />
          )}
          {stepParentEdges.length > 0 && (
            <ConnGroup label="Step-Parents" edgeList={stepParentEdges}
              getOther={e => e.source} allNodes={allNodes} onRemove={removeConn} accentColor="#c9a84c" />
          )}
          {stepChildEdges.length > 0 && (
            <ConnGroup label="Step-Children" edgeList={stepChildEdges}
              getOther={e => e.target} allNodes={allNodes} onRemove={removeConn} accentColor="#c9a84c" />
          )}
          {siblingEdges.length > 0 && (
            <ConnGroup label="Siblings" edgeList={siblingEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#b8845c" />
          )}
          {spouseEdges.length > 0 && (
            <ConnGroup label="Spouse / Partner" edgeList={spouseEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#e879a8" />
          )}
          {friendEdges.length > 0 && (
            <ConnGroup label="Friends" edgeList={friendEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#5bc8f5" />
          )}
          {coworkerEdges.length > 0 && (
            <ConnGroup label="Coworkers" edgeList={coworkerEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#a0a0b8" />
          )}

          {/* Partner-children quick-connect */}
          {partnerChildSuggestions.length > 0 && (
            <button
              type="button"
              className="suggestion-btn"
              onClick={() => { partnerChildSuggestions.forEach(s => addConn(node.id, s.childId)) }}
            >
              + Also parent of {partnerChildSuggestions[0].partner.data.name}'s{' '}
              {partnerChildSuggestions.length === 1
                ? partnerChildSuggestions[0].childNode.data.name
                : `${partnerChildSuggestions.length} children`}
            </button>
          )}

          {/* ── All connected hint ── */}
          {eligibleNodes.length === 0 && allNodes.length > 1 && (
            <p className="conn-all-connected-hint">All members connected. Remove a connection to change its type.</p>
          )}

          {/* ── Add connections: person chips → inline relationship pills ── */}
          {eligibleNodes.length > 0 && (
            <div className="conn-add-section">
              <span className="parent-select-label">Add connection</span>
              <div className="conn-eligible-grid">
                {eligibleNodes.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      className={`conn-eligible-chip${connectTo === n.id ? ' selected' : ''}`}
                      onClick={() => handleConnect(n.id)}
                    >
                      <span className="conn-chip-symbol">{n.data.symbol}</span>
                      <span>{n.data.name}</span>
                    </button>
                  ))}
              </div>
              {connectTarget && (
                <div className="conn-type-row">
                  <span className="conn-type-label">
                    {connectTarget.data.symbol} {connectTarget.data.name} is {node.data.name}'s:
                  </span>
                  <div className="conn-type-pills">
                    {connectOptions.map(opt =>
                      opt.separator ? (
                        <span key={opt.key} className="conn-type-sep" />
                      ) : (
                        <button
                          key={opt.key}
                          type="button"
                          className={`conn-type-pill conn-type-pill--${opt.key}`}
                          onClick={() => { opt.action(); setConnectTo(null) }}
                        >
                          {opt.label}
                        </button>
                      )
                    )}
                    <button type="button" className="conn-type-cancel-pill" onClick={() => setConnectTo(null)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sibling hint — show inferred siblings (from shared parents) that aren't already explicit */}
      {parentEdges.length > 0 && (() => {
        const parentIds = parentEdges.map(e => e.source)
        const explicitSibIds = new Set(siblingEdges.map(e => e.source === node.id ? e.target : e.source))
        const siblings = allNodes.filter(n =>
          n.id !== node.id && !explicitSibIds.has(n.id) &&
          edges.some(e => e.data?.relationType === 'parent-child' && e.target === n.id && parentIds.includes(e.source))
        )
        if (siblings.length === 0) return null
        return (
          <p className="sibling-hint">
            Also sibling{siblings.length > 1 ? 's' : ''}: {siblings.map(s => s.data.name).join(', ')} (detected from shared parents)
          </p>
        )
      })()}

      <div className="edit-cta-row">
        {onViewProfile && (
          <button type="button" className="edit-insights-cta" onClick={onViewProfile}>
            <span>✦</span>
            <span>View Profile</span>
            <span>→</span>
          </button>
        )}
        {onGoToInsights && allNodes.length >= 2 && edges.length > 0 && (
          <button type="button" className="edit-insights-cta" onClick={onGoToInsights}>
            <span>✦</span>
            <span>See Insights</span>
            <span>→</span>
          </button>
        )}
        {onGoToView && (
          <button type="button" className="edit-charts-cta" onClick={onGoToView}>
            <span>✦</span>
            <span>{viewLabel || 'View'}</span>
            <span>→</span>
          </button>
        )}
      </div>

      {!confirmDelete ? (
        <button type="button" className="delete-btn" onClick={() => setConfirmDelete(true)}>
          Remove from Tree
        </button>
      ) : (
        <div className="delete-confirm">
          <p>Remove {node.data.name}?{(() => {
            const count = edges.filter(e => e.source === node.id || e.target === node.id).length
            return count > 0 ? <span className="delete-cascade-note"> {count} connection{count !== 1 ? 's' : ''} will be removed</span> : null
          })()}</p>
          <div className="delete-confirm-actions">
            <button type="button" className="delete-btn" onClick={() => onDelete(node.id)}>Yes, Remove</button>
            <button type="button" className="cancel-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function ConnGroup({ label, edgeList, getOther, allNodes, onRemove, accentColor }) {
  return (
    <div className="connection-group">
      <span className="connection-group-label" style={accentColor ? { color: accentColor + 'cc' } : undefined}>
        {label}
      </span>
      {edgeList.map(e => {
        const other = allNodes.find(n => n.id === getOther(e))
        if (!other) return null
        return (
          <div key={e.id} className="connection-pill">
            <span className="parent-checkbox-symbol">{other.data.symbol}</span>
            <span>{other.data.name}</span>
            <button type="button" className="connection-remove-btn" onClick={() => onRemove(e.id)}
              aria-label={`Remove ${other.data.name}`}>×</button>
          </div>
        )
      })}
    </div>
  )
}
