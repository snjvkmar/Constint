export default function DetailsPanel({ selected, nodeSchemas, edgeSchemas, onEdit, onDelete, onClose }) {
  if (!selected) {
    return (
      <aside className="details-panel empty">
        <p>Select a node or dependency to view details.</p>
        <p className="hint">
          Tip: use "Link Mode" then click two nodes to quickly create a dependency between them.
        </p>
      </aside>
    );
  }

  if (selected.kind === 'node') {
    const node = selected.data;
    const primaryLabel = node.labels[0];
    const schema = nodeSchemas[primaryLabel];
    return (
      <aside className="details-panel">
        <div className="details-header">
          <span className="badge" style={{ background: schema?.color }}>
            {primaryLabel}
          </span>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <h2>{node.properties.name}</h2>
        <table className="prop-table">
          <tbody>
            {Object.entries(node.properties)
              .filter(([k]) => !['name', 'id', 'createdAt', 'updatedAt'].includes(k))
              .map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{String(v)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="details-actions">
          <button onClick={() => onEdit(selected)}>Edit</button>
          <button className="danger" onClick={() => onDelete(selected)}>
            Delete
          </button>
        </div>
      </aside>
    );
  }

  const edge = selected.data;
  const schema = edgeSchemas[edge.type];
  return (
    <aside className="details-panel">
      <div className="details-header">
        <span className="badge edge-badge">{schema?.label || edge.type}</span>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <table className="prop-table">
        <tbody>
          {Object.entries(edge.properties)
            .filter(([k]) => !['id', 'createdAt', 'updatedAt'].includes(k))
            .map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{String(v)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="details-actions">
        <button onClick={() => onEdit(selected)}>Edit</button>
        <button className="danger" onClick={() => onDelete(selected)}>
          Delete
        </button>
      </div>
    </aside>
  );
}
