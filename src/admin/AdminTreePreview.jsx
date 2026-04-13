import { useMemo, useEffect, useCallback } from 'react'
import { ReactFlow, Background, useReactFlow, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import AstroNode from '../components/AstroNode.jsx'
import { applyDagreLayout } from '../utils/layout.js'
import AdminMemberList from './AdminMemberList.jsx'

const NODE_TYPES = { astro: AstroNode }

function AutoFitView() {
  const rf = useReactFlow()
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.4, duration: 300 }), 150)
    return () => clearTimeout(t)
  }, [rf])
  return null
}

function PreviewFlow({ layoutNodes, layoutEdges }) {
  return (
    <ReactFlow
      nodes={layoutNodes}
      edges={layoutEdges}
      nodeTypes={NODE_TYPES}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.4 }}
      minZoom={0.15}
      maxZoom={1}
      colorMode="dark"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#c9a84c22" gap={24} />
      <AutoFitView />
    </ReactFlow>
  )
}

export default function AdminTreePreview({ tree, onClose }) {
  const { layoutNodes, layoutEdges } = useMemo(() => {
    // Clean nodes: ensure type is 'astro', strip stale measured/width/height
    // that may conflict with dagre layout and React Flow fitView
    const cleanNodes = (tree.nodes ?? []).map(n => {
      const { measured, width, height, ...rest } = n
      return { ...rest, type: 'astro', position: { x: 0, y: 0 } }
    })
    const layoutNodes = applyDagreLayout(cleanNodes, tree.edges ?? [])
    return { layoutNodes, layoutEdges: tree.edges ?? [] }
  }, [tree])

  return (
    <div className="admin-preview-overlay" onClick={onClose}>
      <div className="admin-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-preview-header">
          <div>
            <h2 className="admin-preview-title">{tree.title || 'Untitled Chart'}</h2>
            <p className="admin-preview-meta">
              {tree.memberCount} member{tree.memberCount !== 1 ? 's' : ''}
              {tree.email ? ` · ${tree.email}` : ''}
              {tree.savedAt ? ` · ${new Date(tree.savedAt).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button type="button" className="admin-preview-close" onClick={onClose}>×</button>
        </div>

        <div className="admin-preview-body">
          <div className="admin-preview-flow">
            <ReactFlowProvider>
              <PreviewFlow layoutNodes={layoutNodes} layoutEdges={layoutEdges} />
            </ReactFlowProvider>
          </div>

          <div className="admin-preview-members">
            <h3 className="admin-section-title">Members</h3>
            <AdminMemberList nodes={tree.nodes} expanded />
          </div>
        </div>
      </div>
    </div>
  )
}
