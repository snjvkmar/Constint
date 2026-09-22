import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import HubIcon from '@mui/icons-material/Hub';
import GraphCanvas from './components/GraphCanvas.jsx';
import Sidebar from './components/Sidebar.jsx';
import DetailsPanel from './components/DetailsPanel.jsx';
import NodeFormModal from './components/NodeFormModal.jsx';
import EdgeFormModal from './components/EdgeFormModal.jsx';
import { api } from './api/client.js';

const SIDEBAR_WIDTH = 300;
const DETAILS_WIDTH = 340;

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeSchemas, setNodeSchemas] = useState({});
  const [edgeSchemas, setEdgeSchemas] = useState({});
  const [visibleLabels, setVisibleLabels] = useState(new Set());
  const [visibleRelTypes, setVisibleRelTypes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null); // { kind: 'node'|'edge', id } — 1-hop isolation
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
      setVisibleRelTypes((prev) => (prev.size ? prev : new Set(Object.keys(meta.edgeSchemas))));
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

  const nodeCounts = useMemo(() => {
    const c = {};
    nodes.forEach((n) => {
      const l = n.labels[0];
      c[l] = (c[l] || 0) + 1;
    });
    return c;
  }, [nodes]);

  const edgeCounts = useMemo(() => {
    const c = {};
    edges.forEach((e) => {
      c[e.type] = (c[e.type] || 0) + 1;
    });
    return c;
  }, [edges]);

  function toggleLabel(label) {
    setVisibleLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function toggleRelType(type) {
    setVisibleRelTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
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

  function handleFocus(sel) {
    setFocus({ kind: sel.kind, id: sel.data.id });
  }

  function handleClearFocus() {
    setFocus(null);
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
    if (focus && focus.kind === sel.kind && focus.id === sel.data.id) setFocus(null);
    setSelected(null);
    await loadAll();
  }

  const focusLabel = useMemo(() => {
    if (!focus) return null;
    if (focus.kind === 'node') {
      const n = nodes.find((x) => x.id === focus.id);
      return n ? n.properties.name : null;
    }
    const e = edges.find((x) => x.id === focus.id);
    return e ? (edgeSchemas[e.type]?.label || e.type) : null;
  }, [focus, nodes, edges, edgeSchemas]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
            Constint
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            Project &amp; Asset Dependency Graph — Subsea Cable Operations
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 'auto' }}>
            {loading && <CircularProgress size={18} />}
            {linkMode && (
              <Chip
                size="small"
                color="primary"
                label={linkSource ? `Selected "${linkSource.properties.name}" — click target node…` : 'Click a source node…'}
              />
            )}
          </Stack>
        </Toolbar>
        {error && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {error}
          </Alert>
        )}
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Drawer
          variant="permanent"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, position: 'relative', boxSizing: 'border-box' },
          }}
        >
          <Sidebar
            nodeSchemas={nodeSchemas}
            edgeSchemas={edgeSchemas}
            visibleLabels={visibleLabels}
            onToggleLabel={toggleLabel}
            visibleRelTypes={visibleRelTypes}
            onToggleRelType={toggleRelType}
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
            nodeCounts={nodeCounts}
            edgeCounts={edgeCounts}
          />
        </Drawer>

        <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {focus && (
            <Chip
              icon={<HubIcon fontSize="small" />}
              label={`Showing only connected to "${focusLabel}"`}
              onDelete={handleClearFocus}
              color="primary"
              variant="filled"
              sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10, bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'primary.main' }}
            />
          )}
          <GraphCanvas
            nodes={filteredNodes}
            edges={edges}
            nodeSchemas={nodeSchemas}
            visibleLabels={visibleLabels}
            visibleRelTypes={visibleRelTypes}
            focus={focus}
            linkMode={linkMode}
            layoutName={layoutName}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onBackgroundClick={handleBackgroundClick}
          />
        </Box>

        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: DETAILS_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DETAILS_WIDTH, position: 'relative', boxSizing: 'border-box' },
          }}
        >
          <DetailsPanel
            selected={selected}
            focus={focus}
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
            onFocus={handleFocus}
            onClearFocus={handleClearFocus}
            onClose={() => setSelected(null)}
          />
        </Drawer>
      </Box>

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
    </Box>
  );
}
