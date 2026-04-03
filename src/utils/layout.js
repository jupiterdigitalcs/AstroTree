import dagre from '@dagrejs/dagre'

const NODE_WIDTH  = 180
const NODE_HEIGHT = 110
const SPOUSE_GAP  = 200 // horizontal gap between spouses

export function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 })

  nodes.forEach(node => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))

  // Add parent→child edges sorted by child birthdate (oldest left)
  const parentChildEdges = edges.filter(e => e.data?.relationType !== 'spouse')
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

  // Add spouse edges so Dagre knows they're connected (same rank via minlen 0)
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(e => g.setEdge(e.source, e.target, { weight: 2, minlen: 0 }))

  dagre.layout(g)

  const posMap = {}
  nodes.forEach(node => {
    const { x, y } = g.node(node.id)
    posMap[node.id] = {
      x: x - NODE_WIDTH  / 2,
      y: y - NODE_HEIGHT / 2,
    }
  })

  // Post-process: align spouses on the same Y and place them side-by-side
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(({ source, target }) => {
      if (!posMap[source] || !posMap[target]) return
      const avgY = (posMap[source].y + posMap[target].y) / 2
      posMap[source].y = avgY
      posMap[target].y = avgY

      // If spouses ended up stacked or too close, spread them apart
      const dx = Math.abs(posMap[source].x - posMap[target].x)
      if (dx < SPOUSE_GAP) {
        const midX = (posMap[source].x + posMap[target].x) / 2
        posMap[source].x = midX - SPOUSE_GAP / 2
        posMap[target].x = midX + SPOUSE_GAP / 2
      }
    })

  return nodes.map(node => ({
    ...node,
    position: posMap[node.id] ?? node.position,
  }))
}
