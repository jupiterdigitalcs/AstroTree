import dagre from '@dagrejs/dagre'

const NODE_WIDTH  = 180
const NODE_HEIGHT = 110

export function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 60 })

  nodes.forEach(node => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach(edge => {
    // Spouse edges are peer relationships — exclude from hierarchy
    if (edge.data?.relationType !== 'spouse') g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const posMap = {}
  nodes.forEach(node => {
    const { x, y } = g.node(node.id)
    posMap[node.id] = {
      x: x - NODE_WIDTH  / 2,
      y: y - NODE_HEIGHT / 2,
    }
  })

  // Post-process: align spouses to the same Y so they sit side-by-side
  edges
    .filter(e => e.data?.relationType === 'spouse')
    .forEach(({ source, target }) => {
      if (!posMap[source] || !posMap[target]) return
      const avgY = (posMap[source].y + posMap[target].y) / 2
      posMap[source].y = avgY
      posMap[target].y = avgY
    })

  return nodes.map(node => ({
    ...node,
    position: posMap[node.id] ?? node.position,
  }))
}
