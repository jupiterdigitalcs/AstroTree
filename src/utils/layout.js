import dagre from '@dagrejs/dagre'

const NODE_WIDTH  = 220
const NODE_HEIGHT = 140
const SPOUSE_GAP  = 240
const MIN_GAP_X   = NODE_WIDTH + 30

export function applyDagreLayout(nodes, edges) {
  if (nodes.length === 0) return nodes

  // ── Build relationship maps ─────────────────────────────────────────────
  const parentChildEdges = edges.filter(e => {
    const rt = e.data?.relationType
    return rt === 'parent-child' || !rt
  })

  const childToParents = {}
  const parentToChildren = {}
  parentChildEdges.forEach(e => {
    if (!childToParents[e.target]) childToParents[e.target] = []
    childToParents[e.target].push(e.source)
    if (!parentToChildren[e.source]) parentToChildren[e.source] = []
    parentToChildren[e.source].push(e.target)
  })

  const spouseOf = {}
  edges.filter(e => e.data?.relationType === 'spouse').forEach(e => {
    if (!spouseOf[e.source]) spouseOf[e.source] = []
    spouseOf[e.source].push(e.target)
    if (!spouseOf[e.target]) spouseOf[e.target] = []
    spouseOf[e.target].push(e.source)
  })

  // ── Step 1: Assign generations from parent-child edges only ─────────────
  // True roots = have children but no parents
  const generation = {}
  const hasParent = new Set(Object.keys(childToParents))
  const isParent  = new Set(Object.keys(parentToChildren))

  let roots = nodes
    .filter(n => isParent.has(n.id) && !hasParent.has(n.id))
    .map(n => n.id)

  // Fallback: if no clear roots, any node with parent-child edges but no parents
  if (roots.length === 0) {
    roots = nodes
      .filter(n => !hasParent.has(n.id) && (isParent.has(n.id) || childToParents[n.id]))
      .map(n => n.id)
  }

  // If still nothing (only spouse/friend edges), pick first node
  if (roots.length === 0 && nodes.length > 0) {
    roots = [nodes[0].id]
  }

  // BFS down parent→child edges only
  roots.forEach(id => { generation[id] = 0 })
  const queue = [...roots]
  while (queue.length > 0) {
    const id = queue.shift()
    const gen = generation[id]
    ;(parentToChildren[id] || []).forEach(cid => {
      if (generation[cid] == null) {
        generation[cid] = gen + 1
        queue.push(cid)
      }
    })
    // Also walk UP for any node discovered bottom-up
    ;(childToParents[id] || []).forEach(pid => {
      if (generation[pid] == null) {
        generation[pid] = gen - 1
        queue.push(pid)
      }
    })
  }

  // ── Step 2: Propagate generation to spouses ─────────────────────────────
  // A spouse always inherits their partner's generation
  let changed = true
  while (changed) {
    changed = false
    nodes.forEach(n => {
      if (generation[n.id] != null) {
        ;(spouseOf[n.id] || []).forEach(sid => {
          if (generation[sid] == null) {
            generation[sid] = generation[n.id]
            changed = true
          }
        })
      }
    })
  }

  // ── Step 3: Handle any remaining unassigned nodes ───────────────────────
  // (disconnected nodes with no family or spouse edges)
  const maxGen = Math.max(0, ...Object.values(generation))
  nodes.forEach(n => {
    if (generation[n.id] == null) {
      generation[n.id] = maxGen + 1
    }
  })

  // Normalize so minimum generation = 0
  const minGen = Math.min(...Object.values(generation))
  if (minGen !== 0) {
    Object.keys(generation).forEach(id => { generation[id] -= minGen })
  }

  // ── Run Dagre for X positions (family edges only) ──────────────────────
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 100 })

  nodes.forEach(node => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))

  // Parent→child edges sorted by child birthdate
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

  // Spouse edges
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(e => g.setEdge(e.source, e.target, { weight: 2, minlen: 1 }))

  dagre.layout(g)

  // ── Extract Dagre positions (use X only, Y from our generation) ────────
  const posMap = {}
  nodes.forEach(node => {
    const { x } = g.node(node.id)
    posMap[node.id] = { x: x - NODE_WIDTH / 2, y: 0 }
  })

  // ── Set Y from generation ──────────────────────────────────────────────
  const genGroups = {}
  nodes.forEach(n => {
    const gen = generation[n.id]
    if (!genGroups[gen]) genGroups[gen] = []
    genGroups[gen].push(n.id)
  })
  const sortedGens = Object.keys(genGroups).map(Number).sort((a, b) => a - b)
  sortedGens.forEach((gen, gi) => {
    const targetY = gi * (NODE_HEIGHT + 120)
    genGroups[gen].forEach(id => {
      posMap[id].y = targetY
    })
  })

  // ── Align spouses side-by-side ─────────────────────────────────────────
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(({ source, target }) => {
      if (!posMap[source] || !posMap[target]) return
      // Force same Y (should already be, but ensure)
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

  // ── Center children under parent midpoint, sorted by birthdate ────────
  sortedGens.forEach(gen => {
    if (gen === 0) return

    const childGroups = {}
    ;(genGroups[gen] || []).forEach(childId => {
      const parents = childToParents[childId] || []
      if (parents.length === 0) return // no parents (spouse-only or disconnected)
      // Include spouse of parents for center calculation
      const allParents = new Set(parents)
      parents.forEach(pid => {
        ;(spouseOf[pid] || []).forEach(sid => allParents.add(sid))
      })
      const key = [...allParents].sort().join(',')
      if (!childGroups[key]) childGroups[key] = { parents: [...allParents], children: [] }
      childGroups[key].children.push(childId)
    })

    // Sort child groups by parent center X to avoid crossings
    const groupList = Object.values(childGroups)
    groupList.sort((a, b) => {
      const ax = a.parents.reduce((s, id) => s + (posMap[id]?.x ?? 0), 0) / a.parents.length
      const bx = b.parents.reduce((s, id) => s + (posMap[id]?.x ?? 0), 0) / b.parents.length
      return ax - bx
    })

    let cursor = -Infinity
    groupList.forEach(({ parents, children }) => {
      children.sort((a, b) => {
        const na = nodes.find(n => n.id === a)
        const nb = nodes.find(n => n.id === b)
        return (na?.data?.birthdate ?? '') < (nb?.data?.birthdate ?? '') ? -1 : 1
      })

      const parentCenterX = parents.reduce((s, id) => s + (posMap[id]?.x ?? 0) + NODE_WIDTH / 2, 0) / parents.length
      const totalWidth = children.length * MIN_GAP_X
      let startX = parentCenterX - totalWidth / 2

      if (startX < cursor) startX = cursor

      children.forEach((cid, ci) => {
        posMap[cid].x = startX + ci * MIN_GAP_X
      })

      cursor = startX + totalWidth + 20
    })
  })

  // ── Place disconnected nodes centered in their row ─────────────────────
  const disconnectedGen = sortedGens[sortedGens.length - 1]
  const disconnected = (genGroups[disconnectedGen] || []).filter(id => {
    return !childToParents[id] && !parentToChildren[id] &&
      !edges.some(e => e.data?.relationType === 'spouse' && (e.source === id || e.target === id))
  })
  if (disconnected.length > 0) {
    const allX = Object.values(posMap).map(p => p.x)
    const centerX = (Math.min(...allX) + Math.max(...allX)) / 2
    const totalW = disconnected.length * MIN_GAP_X
    const startX = centerX - totalW / 2 + NODE_WIDTH / 2
    disconnected.forEach((id, i) => {
      posMap[id].x = startX + i * MIN_GAP_X
    })
  }

  // ── Final overlap separation ───────────────────────────────────────────
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
