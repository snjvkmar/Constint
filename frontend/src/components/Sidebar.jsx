const LAYOUTS = ['cose-bilkent', 'breadthfirst', 'concentric', 'grid', 'circle'];

export default function Sidebar({
  nodeSchemas,
  edgeSchemas,
  visibleLabels,
  onToggleLabel,
  searchTerm,
  onSearchChange,
  onCreateNode,
  onCreateEdge,
  linkMode,
  onToggleLinkMode,
  layoutName,
  onLayoutChange,
  counts,
}) {
  const labels = Object.keys(nodeSchemas);

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Search</h3>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="sidebar-section">
        <h3>Node Types</h3>
        {labels.map((label) => (
          <label key={label} className="checkbox-row">
            <input type="checkbox" checked={visibleLabels.has(label)} onChange={() => onToggleLabel(label)} />
            <span className="swatch" style={{ background: nodeSchemas[label].color }} />
            {label} <span className="count">({counts[label] || 0})</span>
          </label>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Layout</h3>
        <select value={layoutName} onChange={(e) => onLayoutChange(e.target.value)}>
          {LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar-section actions">
        <h3>Create</h3>
        <button onClick={onCreateNode}>+ Add Node</button>
        <button onClick={onCreateEdge}>+ Add Dependency</button>
        <button className={linkMode ? 'active' : ''} onClick={onToggleLinkMode}>
          {linkMode ? 'Click two nodes… (cancel)' : 'Link Mode: click 2 nodes'}
        </button>
      </div>

      <div className="sidebar-section legend">
        <h3>Relationship Types</h3>
        <ul>
          {Object.values(edgeSchemas).map((s) => (
            <li key={s.type}>{s.label}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
