import dagre from '@dagrejs/dagre'

function getDescendantCount(nodeId, parentToChildren) {
  let count = 0
  const queue = [...(parentToChildren[nodeId] || [])]
  const seen = new Set()
  while (queue.length) {
    const id = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    count++
    for (const child of (parentToChildren[id] || [])) queue.push(child)
  }
  return count
}

export function applyDagreLayout(nodes, edges, options = {}) {
  const { collapsedIds = new Set(), forceExpandedIds = new Set() } = options
  if (nodes.length === 0) return nodes

  // ── Responsive dimensions ──────────────────────────────────────────────
  const compact = typeof window !== 'undefined' && window.innerWidth < 768
  const NODE_WIDTH  = compact ? 160 : 250
  const NODE_HEIGHT = compact ? 120 : 165
  const SPOUSE_GAP  = compact ? 185 : 270
  const MIN_GAP_X   = NODE_WIDTH + (compact ? 25 : 35)
  const GEN_GAP     = compact ? 110 : 120
  const UNIT_GAP    = compact ? 50 : 60
  const DAGRE_NSEP  = compact ? 90 : 110
  const DAGRE_RSEP  = compact ? 120 : 140

  // ── Build relationship maps ─────────────────────────────────────────────
  const parentChildEdges = edges.filter(e => {
    const rt = e.data?.relationType
    return rt === 'parent-child' || rt === 'step-parent' || !rt
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

  // Sibling edges — same generation (align like spouses but don't pair tightly)
  const siblingOf = {}
  edges.filter(e => e.data?.relationType === 'sibling').forEach(e => {
    if (!siblingOf[e.source]) siblingOf[e.source] = []
    siblingOf[e.source].push(e.target)
    if (!siblingOf[e.target]) siblingOf[e.target] = []
    siblingOf[e.target].push(e.source)
  })

  // ── Compute hidden descendants from collapsed nodes ────────────────────
  const hiddenIds = new Set()
  for (const cid of collapsedIds) {
    const queue = [...(parentToChildren[cid] || [])]
    while (queue.length) {
      const id = queue.shift()
      if (hiddenIds.has(id)) continue
      hiddenIds.add(id)
      for (const child of (parentToChildren[id] || [])) queue.push(child)
    }
  }

  // ── Force-expand: un-hide children of explicitly expanded nodes ────────
  // This lets a visible spouse override an ancestor's collapse to show their kids
  for (const fid of forceExpandedIds) {
    const queue = [...(parentToChildren[fid] || [])]
    while (queue.length) {
      const id = queue.shift()
      if (!hiddenIds.has(id)) continue
      hiddenIds.delete(id)
      // Stop recursing into children of nodes that are themselves collapsed
      if (!collapsedIds.has(id)) {
        for (const child of (parentToChildren[id] || [])) queue.push(child)
      }
    }
  }

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

  // Build name lookup for debug logging
  const nameOf = {}
  nodes.forEach(n => { nameOf[n.id] = n.data?.name || n.id })

  console.log('[layout] roots:', roots.map(id => nameOf[id]))
  console.log('[layout] parent→child edges:', parentChildEdges.map(e => `${nameOf[e.source]} → ${nameOf[e.target]}`))
  console.log('[layout] spouse pairs:', edges.filter(e => e.data?.relationType === 'spouse').map(e => `${nameOf[e.source]} ↔ ${nameOf[e.target]}`))

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

  console.log('[layout] after BFS:', Object.entries(generation).map(([id, g]) => `${nameOf[id]}=${g}`).join(', '))

  // ── Step 1b: Validate parent gen < child gen for all parent-child edges ─
  // The BFS may assign incorrect generations when nodes are discovered
  // bottom-up first. Walk all edges and push children down if needed.
  let validated = true
  while (validated) {
    validated = false
    parentChildEdges.forEach(e => {
      const pGen = generation[e.source]
      const cGen = generation[e.target]
      if (pGen != null && cGen != null && pGen >= cGen) {
        generation[e.target] = pGen + 1
        validated = true
      }
    })
  }

  console.log('[layout] after validation:', Object.entries(generation).map(([id, g]) => `${nameOf[id]}=${g}`).join(', '))

  // ── Step 2: Propagate generation to spouses ─────────────────────────────
  // Spouses share a generation row. Use the deeper (higher number) generation
  // so a spouse-only node (e.g. Dante) aligns with their partner who has a
  // parent-child chain placing them lower in the tree.
  let changed = true
  while (changed) {
    changed = false
    nodes.forEach(n => {
      if (generation[n.id] != null) {
        ;(spouseOf[n.id] || []).forEach(sid => {
          const target = generation[n.id]
          if (generation[sid] == null || generation[sid] < target) {
            generation[sid] = target
            changed = true
          }
        })
      }
    })
  }

  // ── Step 2b: Propagate generation to siblings ──────────────────────────
  // Siblings share a generation row; use the deeper (higher number) so a
  // sibling linked to a parent-chain lines up correctly.
  changed = true
  while (changed) {
    changed = false
    nodes.forEach(n => {
      if (generation[n.id] != null) {
        ;(siblingOf[n.id] || []).forEach(sid => {
          const target = generation[n.id]
          if (generation[sid] == null || generation[sid] < target) {
            generation[sid] = target
            changed = true
          }
        })
      }
    })
  }

  console.log('[layout] after spouse align:', Object.entries(generation).map(([id, g]) => `${nameOf[id]}=${g}`).join(', '))

  // Re-validate parent gen < child gen after spouse/sibling alignment may have shifted nodes
  validated = true
  while (validated) {
    validated = false
    parentChildEdges.forEach(e => {
      const pGen = generation[e.source]
      const cGen = generation[e.target]
      if (pGen != null && cGen != null && pGen >= cGen) {
        generation[e.target] = pGen + 1
        validated = true
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

  console.log('[layout] FINAL generations:', Object.entries(generation).map(([id, g]) => `${nameOf[id]}=${g}`).join(', '))

  // ── Run Dagre for X positions (family edges only) ──────────────────────
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: DAGRE_RSEP, nodesep: DAGRE_NSEP })

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

  // Sibling edges — keep siblings near each other
  edges
    .filter(e => e.data?.relationType === 'sibling')
    .forEach(e => g.setEdge(e.source, e.target, { weight: 1, minlen: 1 }))

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
    const targetY = gi * (NODE_HEIGHT + GEN_GAP)
    genGroups[gen].forEach(id => {
      posMap[id].y = targetY
    })
  })

  // ── Arrange each generation row: spouse pairs together, then space evenly ─
  // Build spouse pair lookup (only process each pair once)
  const spouseEdgeList = edges.filter(e => e.data?.relationType === 'spouse')
  const pairedWith = {} // nodeId → partnerId (first spouse edge wins)
  spouseEdgeList.forEach(({ source, target }) => {
    if (!pairedWith[source] && !pairedWith[target]) {
      pairedWith[source] = target
      pairedWith[target] = source
    }
  })

  // For each generation, build ordered list of "units" (single nodes or spouse pairs)
  // and lay them out left-to-right. Track max units for LR detection.
  let maxUnitsInRow = 0
  sortedGens.forEach(gen => {
    const row = genGroups[gen] || []
    if (row.length === 0) return

    // Build units: group spouse pairs as one unit
    const visited = new Set()
    const units = [] // each unit: { ids: [id] or [id1, id2], x: dagre center x }
    // Sort row by Dagre X so we preserve rough order
    const rowSorted = [...row].sort((a, b) => (posMap[a]?.x ?? 0) - (posMap[b]?.x ?? 0))

    rowSorted.forEach(id => {
      if (visited.has(id)) return
      visited.add(id)
      const partner = pairedWith[id]
      if (partner && row.includes(partner) && !visited.has(partner)) {
        visited.add(partner)
        // Keep the one with lower dagre X on the left
        const leftId = (posMap[id]?.x ?? 0) <= (posMap[partner]?.x ?? 0) ? id : partner
        const rightId = leftId === id ? partner : id
        const cx = ((posMap[id]?.x ?? 0) + (posMap[partner]?.x ?? 0)) / 2
        units.push({ ids: [leftId, rightId], x: cx, isPair: true })
      } else {
        units.push({ ids: [id], x: posMap[id]?.x ?? 0, isPair: false })
      }
    })

    maxUnitsInRow = Math.max(maxUnitsInRow, units.length)

    // Sort units by their Dagre center X
    units.sort((a, b) => a.x - b.x)

    // Lay out units left-to-right with proper spacing
    // First, compute total width needed
    const unitWidths = units.map(u => u.isPair ? SPOUSE_GAP + NODE_WIDTH : NODE_WIDTH)
    const totalWidth = unitWidths.reduce((s, w) => s + w, 0) + (units.length - 1) * UNIT_GAP
    // Center the row around the average Dagre X
    const avgX = units.reduce((s, u) => s + u.x, 0) / units.length
    let cursor = avgX - totalWidth / 2

    units.forEach((unit, ui) => {
      if (unit.isPair) {
        posMap[unit.ids[0]].x = cursor
        posMap[unit.ids[1]].x = cursor + SPOUSE_GAP
        posMap[unit.ids[0]].y = posMap[unit.ids[1]].y // ensure same Y
      } else {
        posMap[unit.ids[0]].x = cursor
      }
      cursor += unitWidths[ui] + UNIT_GAP
    })
  })

  // ── Center children under parent midpoint, sorted by birthdate ────────
  // Run top-down so parent positions are finalized before children
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
      const ax = a.parents.reduce((s, id) => s + (posMap[id]?.x ?? 0) + NODE_WIDTH / 2, 0) / a.parents.length
      const bx = b.parents.reduce((s, id) => s + (posMap[id]?.x ?? 0) + NODE_WIDTH / 2, 0) / b.parents.length
      return ax - bx
    })

    // Also include nodes that are spouses but have no parents (they stay with their partner)
    // These are already positioned by the row layout above, so skip them

    let cursor = -Infinity
    groupList.forEach(({ parents, children }) => {
      children.sort((a, b) => {
        const na = nodes.find(n => n.id === a)
        const nb = nodes.find(n => n.id === b)
        return (na?.data?.birthdate ?? '') < (nb?.data?.birthdate ?? '') ? -1 : 1
      })

      // Build child units: pair each child with their spouse (if in same gen)
      const childVisited = new Set()
      const childUnits = []
      children.forEach(cid => {
        if (childVisited.has(cid)) return
        childVisited.add(cid)
        const partner = pairedWith[cid]
        if (partner && generation[partner] === gen && !childVisited.has(partner)) {
          // Partner is a spouse-only node (not in children list) or a sibling
          const partnerIsChild = children.includes(partner)
          if (!partnerIsChild) {
            childVisited.add(partner)
            childUnits.push({ ids: [cid, partner], isPair: true })
          } else {
            // Both are siblings — place as separate units, they'll each get their own spouses
            childUnits.push({ ids: [cid], isPair: false })
          }
        } else {
          childUnits.push({ ids: [cid], isPair: false })
        }
      })

      const parentCenterX = parents.reduce((s, id) => s + (posMap[id]?.x ?? 0) + NODE_WIDTH / 2, 0) / parents.length
      const unitWidths = childUnits.map(u => u.isPair ? NODE_WIDTH + SPOUSE_GAP : NODE_WIDTH)
      const totalWidth = unitWidths.reduce((s, w) => s + w, 0) + (childUnits.length - 1) * UNIT_GAP
      let startX = parentCenterX - totalWidth / 2

      if (startX < cursor) startX = cursor

      let unitCursor = startX
      childUnits.forEach((unit, ui) => {
        if (unit.isPair) {
          posMap[unit.ids[0]].x = unitCursor
          posMap[unit.ids[1]].x = unitCursor + SPOUSE_GAP
          posMap[unit.ids[1]].y = posMap[unit.ids[0]].y
        } else {
          posMap[unit.ids[0]].x = unitCursor
        }
        unitCursor += unitWidths[ui] + UNIT_GAP
      })

      cursor = unitCursor + (compact ? 40 : 70) - UNIT_GAP
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

  // ── Auto LR: transpose for wide trees on mobile ───────────────────────
  const isLR = compact && maxUnitsInRow >= 3
  if (isLR) {
    Object.keys(posMap).forEach(id => {
      const { x, y } = posMap[id]
      posMap[id] = { x: y, y: x }
    })
  }

  // ── Return nodes with positions + layout metadata ─────────────────────
  return nodes.map(node => {
    const children = parentToChildren[node.id] || []
    const visibleChildren = children.filter(cid => !hiddenIds.has(cid))
    const isSelfCollapsed = collapsedIds.has(node.id)
    const childrenHidden = children.length > 0 && visibleChildren.length === 0
    // isCollapsed = this node's collapse is actively hiding children (not overridden by force-expand)
    const isCollapsed = isSelfCollapsed && childrenHidden
    // isAutoCollapsed = children hidden by someone else's collapse (e.g. spouse's parent collapsed)
    const isAutoCollapsed = childrenHidden && !isSelfCollapsed && !forceExpandedIds.has(node.id)
    return {
      ...node,
      position: posMap[node.id] ?? { x: 0, y: 0 },
      hidden: hiddenIds.has(node.id),
      data: {
        ...node.data,
        layoutDirection: isLR ? 'LR' : 'TB',
        hasChildren: children.length > 0,
        isCollapsed,
        isAutoCollapsed,
        hiddenCount: (isCollapsed || isAutoCollapsed) ? getDescendantCount(node.id, parentToChildren) : 0,
      },
    }
  })
}
