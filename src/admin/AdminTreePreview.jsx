import { useMemo } from 'react'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import AstroNode from '../components/AstroNode.jsx'
import { applyDagreLayout } from '../utils/layout.js'
import AdminMemberList from './AdminMemberList.jsx'

const NODE_TYPES = { astro: AstroNode }

export default function AdminTreePreview({ tree, onClose }) {
  const { layoutNodes, layoutEdges } = useMemo(() => {
    const layoutNodes = applyDagreLayout(tree.nodes ?? [], tree.edges ?? [])
    return { layoutNodes, layoutEdges: tree.edges ?? [] }
  }, [tree])

  return (
    <div className="admin-preview-overlay" onClick={onClose}>
      <div className="admin-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-preview-header">
          <div>
            <h2 className="admin-preview-title">{tree.title}</h2>
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
            <ReactFlow
              nodes={layoutNodes}
              edges={layoutEdges}
              nodeTypes={NODE_TYPES}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background color="#c9a84c22" gap={24} />
              <Controls showInteractive={false} />
            </ReactFlow>
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
