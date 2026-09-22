import { useMemo, useState } from 'react';

function initFieldValues(fields, existing = {}) {
  const values = {};
  fields.forEach((f) => {
    values[f.name] = existing[f.name] ?? '';
  });
  return values;
}

function nodeLabel(node) {
  return `${node.properties.name} (${node.labels[0]})`;
}

export default function EdgeFormModal({ nodes, edgeSchemas, mode, initial, onSubmit, onCancel }) {
  const relTypes = Object.keys(edgeSchemas);
  const [type, setType] = useState(initial?.type || relTypes[0]);
  const [sourceId, setSourceId] = useState(initial?.sourceId || '');
  const [targetId, setTargetId] = useState(initial?.targetId || '');
  const fields = edgeSchemas[type]?.fields || [];
  const [values, setValues] = useState(() => initFieldValues(fields, initial?.properties));

  const allowedPairs = edgeSchemas[type]?.allowedPairs;

  const sourceOptions = useMemo(() => {
    if (!allowedPairs) return nodes;
    const allowedSourceLabels = new Set(allowedPairs.map((p) => p[0]));
    return nodes.filter((n) => n.labels.some((l) => allowedSourceLabels.has(l)));
  }, [nodes, allowedPairs]);

  const targetOptions = useMemo(() => {
    if (!allowedPairs) return nodes;
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return nodes;
    const validTargetLabels = new Set(
      allowedPairs.filter((p) => sourceNode.labels.includes(p[0])).map((p) => p[1])
    );
    if (!validTargetLabels.size) return nodes;
    return nodes.filter((n) => n.labels.some((l) => validTargetLabels.has(l)));
  }, [nodes, allowedPairs, sourceId]);

  function handleTypeChange(newType) {
    setType(newType);
    setValues(initFieldValues(edgeSchemas[newType].fields, {}));
  }

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!sourceId || !targetId) return;
    const properties = {};
    fields.forEach((f) => {
      const raw = values[f.name];
      if (raw === '' || raw === undefined) return;
      properties[f.name] = f.type === 'number' ? Number(raw) : raw;
    });
    onSubmit({ sourceId, targetId, type, properties });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{mode === 'edit' ? 'Edit Dependency' : 'Create Dependency'}</h3>
        <label className="form-row">
          Relationship Type
          <select value={type} disabled={mode === 'edit'} onChange={(e) => handleTypeChange(e.target.value)}>
            {relTypes.map((t) => (
              <option key={t} value={t}>
                {edgeSchemas[t].label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-row">
          From
          <select value={sourceId} disabled={mode === 'edit'} required onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Select source node…</option>
            {sourceOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {nodeLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-row">
          To
          <select value={targetId} disabled={mode === 'edit'} required onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Select target node…</option>
            {targetOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {nodeLabel(n)}
              </option>
            ))}
          </select>
        </label>
        {fields.map((f) => (
          <label className="form-row" key={f.name}>
            {f.label}
            {f.type === 'enum' ? (
              <select value={values[f.name]} onChange={(e) => handleChange(f.name, e.target.value)}>
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                value={values[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
              />
            )}
          </label>
        ))}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {mode === 'edit' ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
