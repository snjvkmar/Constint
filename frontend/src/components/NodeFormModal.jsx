import { useState } from 'react';

function initFieldValues(fields, existing = {}) {
  const values = {};
  fields.forEach((f) => {
    values[f.name] = existing[f.name] ?? '';
  });
  return values;
}

export default function NodeFormModal({ nodeSchemas, mode, initialLabel, initialNode, onSubmit, onCancel }) {
  const labels = Object.keys(nodeSchemas);
  const [label, setLabel] = useState(initialLabel || labels[0]);
  const fields = nodeSchemas[label]?.fields || [];
  const [values, setValues] = useState(() => initFieldValues(fields, initialNode?.properties));

  function handleLabelChange(newLabel) {
    setLabel(newLabel);
    setValues(initFieldValues(nodeSchemas[newLabel].fields, {}));
  }

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const properties = {};
    fields.forEach((f) => {
      const raw = values[f.name];
      if (raw === '' || raw === undefined) return;
      properties[f.name] = f.type === 'number' ? Number(raw) : raw;
    });
    onSubmit({ label, properties });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{mode === 'edit' ? 'Edit Node' : 'Create Node'}</h3>
        <label className="form-row">
          Type
          <select value={label} disabled={mode === 'edit'} onChange={(e) => handleLabelChange(e.target.value)}>
            {labels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {fields.map((f) => (
          <label className="form-row" key={f.name}>
            {f.label}
            {f.required ? ' *' : ''}
            {f.type === 'enum' ? (
              <select
                value={values[f.name]}
                required={f.required}
                onChange={(e) => handleChange(f.name, e.target.value)}
              >
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
                required={f.required}
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
