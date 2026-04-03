import dagre from '@dagrejs/dagre'

const NODE_WIDTH  = 220
const NODE_HEIGHT = 140
const SPOUSE_GAP  = 240
const MIN_GAP_X   = NODE_WIDTH + 30

export function applyDagreLayout(nodes, edges) {
  if (nodes.length === 0) return nodes

  // ── Build family-only adjacency ──────────────────────────────────────────
  const familyEdges = edges.filter(e => {
    const rt = e.data?.relationType
    return rt === 'parent-child' || rt === 'spouse' || !rt
  })
  const parentChildEdges = familyEdges.filter(e =>
    e.data?.relationType !== 'spouse'
  )

  // ── Compute generation depth via BFS from roots ─────────────────────────
  // Build child→parents and parent→children maps
  const childToParents = {}
  const parentToChildren = {}
  parentChildEdges.forEach(e => {
    if (!childToParents[e.target]) childToParents[e.target] = []
    childToParents[e.target].push(e.source)
    if (!parentToChildren[e.source]) parentToChildren[e.source] = []
    parentToChildren[e.source].push(e.target)
  })

  // Find spouse pairs
  const spousePairs = {}
  edges.filter(e => e.data?.relationType === 'spouse').forEach(e => {
    if (!spousePairs[e.source]) spousePairs[e.source] = []
    spousePairs[e.source].push(e.target)
    if (!spousePairs[e.target]) spousePairs[e.target] = []
    spousePairs[e.target].push(e.source)
  })

  // Nodes connected to family structure (via any family edge)
  const familyConnected = new Set()
  familyEdges.forEach(e => {
    familyConnected.add(e.source)
    familyConnected.add(e.target)
  })

  // Roots = nodes that are parents but have no parents themselves
  // If no clear roots, pick nodes with no incoming parent-child edges
  const allNodeIds = new Set(nodes.map(n => n.id))
  const hasParent = new Set(Object.keys(childToParents))
  const isParent = new Set(Object.keys(parentToChildren))

  let roots = nodes
    .filter(n => familyConnected.has(n.id) && !hasParent.has(n.id))
    .map(n => n.id)

  // If no roots found (circular?), just pick first family-connected node
  if (roots.length === 0 && familyConnected.size > 0) {
    roots = [familyConnected.values().next().value]
  }

  // BFS to assign generations
  const generation = {}
  const queue = [...roots]
  roots.forEach(id => { generation[id] = 0 })

  while (queue.length > 0) {
    const id = queue.shift()
    const gen = generation[id]

    // Spouse gets same generation
    ;(spousePairs[id] || []).forEach(sid => {
      if (generation[sid] == null) {
        generation[sid] = gen
        queue.push(sid)
      }
    })

    // Children get next generation
    ;(parentToChildren[id] || []).forEach(cid => {
      if (generation[cid] == null) {
        generation[cid] = gen + 1
        queue.push(cid)
      }
    })

    // Parents get previous generation (for nodes discovered bottom-up)
    ;(childToParents[id] || []).forEach(pid => {
      if (generation[pid] == null) {
        generation[pid] = gen - 1
        queue.push(pid)
      }
    })
  }

  // Normalize generations so minimum is 0
  const genValues = Object.values(generation)
  if (genValues.length > 0) {
    const minGen = Math.min(...genValues)
    if (minGen !== 0) {
      Object.keys(generation).forEach(id => { generation[id] -= minGen })
    }
  }

  // Disconnected nodes (friend/coworker only) — place in their own row
  const disconnected = nodes.filter(n => !familyConnected.has(n.id))
  const maxGen = genValues.length > 0 ? Math.max(...Object.values(generation)) : -1
  disconnected.forEach(n => {
    generation[n.id] = maxGen + 1
  })

  // ── Run Dagre with only family edges ────────────────────────────────────
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 100 })

  nodes.forEach(node => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))

  // Feed parent→child edges sorted by child birthdate (oldest left)
  const byParent = {}
  parentChildEdges.forEach(e => {
    if (!byParent[e.source]) byParent[e.source] = []
    byParent[e.source].push(e)
  })
  Object.values(byParent).forEach(group => {
    group
      .sort((a, b) => {
        const na = nodes.find(n => n.id === a.target)
        const nb = nodes.find(n => n.id === b.target)
        return (na?.data?.birthdate ?? '') < (nb?.data?.birthdate ?? '') ? -1 : 1
      })
      .forEach(e => g.setEdge(e.source, e.target))
  })

  // Spouse edges (keep on same rank)
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(e => g.setEdge(e.source, e.target, { weight: 2, minlen: 1 }))

  // NOTE: friend/coworker edges are NOT added to Dagre — they don't affect layout

  dagre.layout(g)

  // ── Extract positions ───────────────────────────────────────────────────
  const posMap = {}
  nodes.forEach(node => {
    const { x, y } = g.node(node.id)
    posMap[node.id] = { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 }
  })

  // ── Force generation alignment ─────────────────────────────────────────
  // Group nodes by generation and set all nodes in same generation to same Y
  const genGroups = {}
  nodes.forEach(n => {
    const gen = generation[n.id] ?? 0
    if (!genGroups[gen]) genGroups[gen] = []
    genGroups[gen].push(n.id)
  })

  // For each generation, use the Y from Dagre for the first node, then align all
  const sortedGens = Object.keys(genGroups).map(Number).sort((a, b) => a - b)
  sortedGens.forEach((gen, gi) => {
    const targetY = gi * (NODE_HEIGHT + 120) // consistent vertical spacing
    genGroups[gen].forEach(id => {
      posMap[id].y = targetY
    })
  })

  // ── Align spouses side-by-side ──────────────────────────────────────────
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(({ source, target }) => {
      if (!posMap[source] || !posMap[target]) return
      const avgY = (posMap[source].y + posMap[target].y) / 2
      posMap[source].y = avgY
      posMap[target].y = avgY

      const dx = Math.abs(posMap[source].x - posMap[target].x)
      if (dx < SPOUSE_GAP) {
        const midX = (posMap[source].x + posMap[target].x) / 2
        posMap[source].x = midX - SPOUSE_GAP / 2
        posMap[target].x = midX + SPOUSE_GAP / 2
      }
    })

  // ── Center children under parent midpoint, sorted by birthdate ─────────
  // Process generation by generation top-down so parent positions are final
  sortedGens.forEach(gen => {
    if (gen === 0) return // roots have no parents to center under

    // Group children by their parent set
    const childGroups = {} // key = sorted parent IDs, value = [child IDs]
    ;(genGroups[gen] || []).forEach(childId => {
      const parents = childToParents[childId] || []
      // Also include spouse of any parent (they share the center point)
      const allParents = new Set(parents)
      parents.forEach(pid => {
        ;(spousePairs[pid] || []).forEach(sid => allParents.add(sid))
      })
      const key = [...allParents].sort().join(',')
      if (!key) return // disconnected node
      if (!childGroups[key]) childGroups[key] = { parents: [...allParents], children: [] }
      childGroups[key].children.push(childId)
    })

    // Sort child groups left-to-right by parent center X to avoid crossings
    const groupList = Object.values(childGroups)
    groupList.sort((a, b) => {
      const aCenter = a.parents.reduce((s, id) => s + (posMap[id]?.x ?? 0), 0) / a.parents.length
      const bCenter = b.parents.reduce((s, id) => s + (posMap[id]?.x ?? 0), 0) / b.parents.length
      return aCenter - bCenter
    })

    // Assign X positions: each child group centered under its parents
    // but groups laid out left-to-right without overlapping
    let cursor = -Infinity
    groupList.forEach(({ parents, children }) => {
      // Sort children by birthdate (oldest left)
      children.sort((a, b) => {
        const na = nodes.find(n => n.id === a)
        const nb = nodes.find(n => n.id === b)
        return (na?.data?.birthdate ?? '') < (nb?.data?.birthdate ?? '') ? -1 : 1
      })

      const parentCenterX = parents.reduce((s, id) => s + (posMap[id]?.x ?? 0) + NODE_WIDTH / 2, 0) / parents.length
      const totalWidth = children.length * MIN_GAP_X
      let startX = parentCenterX - totalWidth / 2

      // Don't overlap with previous group
      if (startX < cursor) startX = cursor

      children.forEach((cid, ci) => {
        posMap[cid].x = startX + ci * MIN_GAP_X
      })

      cursor = startX + totalWidth + 20 // gap between groups
    })
  })

  // ── Place disconnected nodes evenly in their row ────────────────────────
  if (disconnected.length > 0) {
    // Find the center X of the whole tree
    const familyIds = nodes.filter(n => familyConnected.has(n.id)).map(n => n.id)
    const allX = familyIds.map(id => posMap[id].x)
    const centerX = allX.length > 0
      ? (Math.min(...allX) + Math.max(...allX)) / 2
      : 0
    const totalW = disconnected.length * MIN_GAP_X
    const startX = centerX - totalW / 2 + NODE_WIDTH / 2
    disconnected.forEach((n, i) => {
      posMap[n.id].x = startX + i * MIN_GAP_X
    })
  }

  // ── Final overlap separation ────────────────────────────────────────────
  const ids = Object.keys(posMap)
  for (let pass = 0; pass < 20; pass++) {
    let moved = false
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = posMap[ids[i]], b = posMap[ids[j]]
        const dx = Math.abs(a.x - b.x)
        const dy = Math.abs(a.y - b.y)
        if (dx < MIN_GAP_X && dy < NODE_HEIGHT) {
          const push = (MIN_GAP_X - dx) / 2 + 1
          if (a.x <= b.x) { a.x -= push; b.x += push }
          else             { a.x += push; b.x -= push }
          moved = true
        }
      }
    }
    if (!moved) break
  }

  return nodes.map(node => ({
    ...node,
    position: posMap[node.id] ?? node.position,
  }))
}
