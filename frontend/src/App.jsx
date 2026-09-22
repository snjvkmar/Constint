import { useCallback, useEffect, useMemo, useState } from 'react';
import GraphCanvas from './components/GraphCanvas.jsx';
import Sidebar from './components/Sidebar.jsx';
import DetailsPanel from './components/DetailsPanel.jsx';
import NodeFormModal from './components/NodeFormModal.jsx';
import EdgeFormModal from './components/EdgeFormModal.jsx';
import { api } from './api/client.js';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeSchemas, setNodeSchemas] = useState({});
  const [edgeSchemas, setEdgeSchemas] = useState({});
  const [visibleLabels, setVisibleLabels] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState(null);
  const [layoutName, setLayoutName] = useState('cose-bilkent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [graph, meta] = await Promise.all([api.getGraph(), api.getMeta()]);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setNodeSchemas(meta.nodeSchemas);
      setEdgeSchemas(meta.edgeSchemas);
      setVisibleLabels((prev) => (prev.size ? prev : new Set(Object.keys(meta.nodeSchemas))));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    const q = searchTerm.toLowerCase();
    return nodes.filter((n) => (n.properties.name || '').toLowerCase().includes(q));
  }, [nodes, searchTerm]);

  const counts = useMemo(() => {
    const c = {};
    nodes.forEach((n) => {
      const l = n.labels[0];
      c[l] = (c[l] || 0) + 1;
    });
    return c;
  }, [nodes]);

  function toggleLabel(label) {
    setVisibleLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleNodeClick(node) {
    if (linkMode) {
      if (!linkSource) {
        setLinkSource(node);
      } else if (linkSource.id === node.id) {
        setLinkSource(null);
      } else {
        setModal({ kind: 'edge', mode: 'create', initial: { sourceId: linkSource.id, targetId: node.id } });
        setLinkMode(false);
        setLinkSource(null);
      }
      return;
    }
    setSelected({ kind: 'node', data: node });
  }

  function handleEdgeClick(edge) {
    setSelected({ kind: 'edge', data: edge });
  }

  function handleBackgroundClick() {
    setSelected(null);
  }

  async function handleSaveNode(payload) {
    if (modal.mode === 'edit') {
      await api.updateNode(modal.initialNode.id, payload.properties);
    } else {
      await api.createNode(payload.label, payload.properties);
    }
    setModal(null);
    await loadAll();
  }

  async function handleSaveEdge(payload) {
    if (modal.mode === 'edit') {
      await api.updateEdge(modal.initialEdge.id, payload.properties);
    } else {
      await api.createEdge(payload);
    }
    setModal(null);
    await loadAll();
  }

  async function handleDelete(sel) {
    const confirmMsg =
      sel.kind === 'node'
        ? `Delete "${sel.data.properties.name}"? This also removes all its dependencies.`
        : 'Delete this dependency?';
    if (!window.confirm(confirmMsg)) return;
    if (sel.kind === 'node') await api.deleteNode(sel.data.id);
    else await api.deleteEdge(sel.data.id);
    setSelected(null);
    await loadAll();
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Constint</h1>
        <span className="subtitle">Project &amp; Asset Dependency Graph — Subsea Cable Operations</span>
        {loading && <span className="status">Loading…</span>}
        {error && <span className="status error">Error: {error}</span>}
        {linkMode && (
          <span className="status link-hint">
            {linkSource ? `Selected "${linkSource.properties.name}" — click target node…` : 'Click a source node…'}
          </span>
        )}
      </header>

      <Sidebar
        nodeSchemas={nodeSchemas}
        edgeSchemas={edgeSchemas}
        visibleLabels={visibleLabels}
        onToggleLabel={toggleLabel}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateNode={() => setModal({ kind: 'node', mode: 'create' })}
        onCreateEdge={() => setModal({ kind: 'edge', mode: 'create' })}
        linkMode={linkMode}
        onToggleLinkMode={() => {
          setLinkMode((v) => !v);
          setLinkSource(null);
        }}
        layoutName={layoutName}
        onLayoutChange={setLayoutName}
        counts={counts}
      />

      <div className="canvas-wrap">
        <GraphCanvas
          nodes={filteredNodes}
          edges={edges}
          nodeSchemas={nodeSchemas}
          visibleLabels={visibleLabels}
          linkMode={linkMode}
          layoutName={layoutName}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onBackgroundClick={handleBackgroundClick}
        />
      </div>

      <DetailsPanel
        selected={selected}
        nodeSchemas={nodeSchemas}
        edgeSchemas={edgeSchemas}
        onEdit={(sel) => {
          if (sel.kind === 'node') {
            setModal({ kind: 'node', mode: 'edit', initialLabel: sel.data.labels[0], initialNode: sel.data });
          } else {
            setModal({
              kind: 'edge',
              mode: 'edit',
              initial: {
                type: sel.data.type,
                sourceId: sel.data.startNodeId,
                targetId: sel.data.endNodeId,
                properties: sel.data.properties,
              },
              initialEdge: sel.data,
            });
          }
        }}
        onDelete={handleDelete}
        onClose={() => setSelected(null)}
      />

      {modal?.kind === 'node' && (
        <NodeFormModal
          nodeSchemas={nodeSchemas}
          mode={modal.mode}
          initialLabel={modal.initialLabel}
          initialNode={modal.initialNode}
          onSubmit={handleSaveNode}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.kind === 'edge' && (
        <EdgeFormModal
          nodes={nodes}
          edgeSchemas={edgeSchemas}
          mode={modal.mode}
          initial={modal.initial}
          onSubmit={handleSaveEdge}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
