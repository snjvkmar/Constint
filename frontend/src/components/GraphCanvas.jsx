import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

cytoscape.use(coseBilkent);

const DEFAULT_COLOR = '#64748b';
const DEFAULT_SHAPE = 'ellipse';

// Given an optional focus ({ kind: 'node' | 'edge', id }), compute the set of
// node/edge ids that make up its 1-hop neighborhood: for a focused node, the
// node itself plus everything directly connected to it; for a focused edge,
// its two endpoints plus every edge directly between them.
function computeFocusSets(edges, focus) {
  if (!focus) return null;

  if (focus.kind === 'node') {
    const nodeIds = new Set([focus.id]);
    const relevantEdges = edges.filter((e) => e.startNodeId === focus.id || e.endNodeId === focus.id);
    relevantEdges.forEach((e) => {
      nodeIds.add(e.startNodeId);
      nodeIds.add(e.endNodeId);
    });
    return { nodeIds, edgeIds: new Set(relevantEdges.map((e) => e.id)) };
  }

  const edge = edges.find((e) => e.id === focus.id);
  if (!edge) return null;
  const nodeIds = new Set([edge.startNodeId, edge.endNodeId]);
  const edgeIds = new Set(
    edges.filter((e) => nodeIds.has(e.startNodeId) && nodeIds.has(e.endNodeId)).map((e) => e.id)
  );
  return { nodeIds, edgeIds };
}

function buildElements(nodes, edges, visibleLabels, visibleRelTypes, focus) {
  const focusSets = computeFocusSets(edges, focus);

  const visibleNodeIds = new Set();
  const nodeEls = nodes
    .filter((n) => n.labels.some((l) => visibleLabels.has(l)))
    .filter((n) => !focusSets || focusSets.nodeIds.has(n.id))
    .map((n) => {
      visibleNodeIds.add(n.id);
      const primaryLabel = n.labels[0];
      return {
        data: {
          id: n.id,
          label: n.properties.name || primaryLabel,
          entityLabel: primaryLabel,
          raw: n,
        },
      };
    });

  const edgeEls = edges
    .filter((e) => visibleRelTypes.has(e.type))
    .filter((e) => visibleNodeIds.has(e.startNodeId) && visibleNodeIds.has(e.endNodeId))
    .filter((e) => !focusSets || focusSets.edgeIds.has(e.id))
    .map((e) => ({
      data: {
        id: e.id,
        source: e.startNodeId,
        target: e.endNodeId,
        label: e.type.replace(/_/g, ' '),
        raw: e,
      },
    }));

  return [...nodeEls, ...edgeEls];
}

function runLayout(cy, layoutName) {
  cy.layout({ name: layoutName || 'cose-bilkent', animate: true, randomize: true, fit: true, padding: 40 }).run();
}

export default function GraphCanvas({
  nodes,
  edges,
  nodeSchemas,
  visibleLabels,
  visibleRelTypes,
  focus,
  linkMode,
  onNodeClick,
  onEdgeClick,
  onBackgroundClick,
  layoutName,
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const onNodeClickRef = useRef(onNodeClick);
  const onEdgeClickRef = useRef(onEdgeClick);
  const onBackgroundClickRef = useRef(onBackgroundClick);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);
  useEffect(() => {
    onEdgeClickRef.current = onEdgeClick;
  }, [onEdgeClick]);
  useEffect(() => {
    onBackgroundClickRef.current = onBackgroundClick;
  }, [onBackgroundClick]);

  useEffect(() => {
    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => (nodeSchemas[ele.data('entityLabel')] || {}).color || DEFAULT_COLOR,
            shape: (ele) => (nodeSchemas[ele.data('entityLabel')] || {}).shape || DEFAULT_SHAPE,
            label: 'data(label)',
            color: '#0f172a',
            'font-size': 11,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            width: 42,
            height: 42,
            'border-width': 2,
            'border-color': '#ffffff',
          },
        },
        { selector: 'node:selected', style: { 'border-color': '#0f172a', 'border-width': 3 } },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 9,
            color: '#475569',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.85,
            'text-background-padding': 2,
          },
        },
        {
          selector: 'edge:selected',
          style: { 'line-color': '#0f172a', 'target-arrow-color': '#0f172a', width: 3 },
        },
      ],
      wheelSensitivity: 0.3,
    });

    cy.on('tap', 'node', (evt) => onNodeClickRef.current?.(evt.target.data('raw')));
    cy.on('tap', 'edge', (evt) => onEdgeClickRef.current?.(evt.target.data('raw')));
    cy.on('tap', (evt) => {
      if (evt.target === cy) onBackgroundClickRef.current?.();
    });

    cyRef.current = cy;
    return () => cy.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeSchemas]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const elements = buildElements(nodes, edges, visibleLabels, visibleRelTypes, focus);
    cy.elements().remove();
    cy.add(elements);
    runLayout(cy, layoutName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, nodeSchemas, visibleLabels, visibleRelTypes, focus]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    runLayout(cy, layoutName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutName]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.classList.toggle('link-mode', !!linkMode);
  }, [linkMode]);

  return <div ref={containerRef} className="graph-canvas" />;
}
