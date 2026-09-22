import { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

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
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{mode === 'edit' ? 'Edit Dependency' : 'Create Dependency'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              label="Relationship Type"
              value={type}
              disabled={mode === 'edit'}
              onChange={(e) => handleTypeChange(e.target.value)}
              fullWidth
              size="small"
            >
              {relTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {edgeSchemas[t].label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="From"
              value={sourceId}
              disabled={mode === 'edit'}
              required
              onChange={(e) => setSourceId(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">Select source node…</MenuItem>
              {sourceOptions.map((n) => (
                <MenuItem key={n.id} value={n.id}>
                  {nodeLabel(n)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="To"
              value={targetId}
              disabled={mode === 'edit'}
              required
              onChange={(e) => setTargetId(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">Select target node…</MenuItem>
              {targetOptions.map((n) => (
                <MenuItem key={n.id} value={n.id}>
                  {nodeLabel(n)}
                </MenuItem>
              ))}
            </TextField>
            {fields.map((f) =>
              f.type === 'enum' ? (
                <TextField
                  key={f.name}
                  select
                  label={f.label}
                  value={values[f.name]}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">—</MenuItem>
                  {f.options.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  key={f.name}
                  label={f.label}
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={values[f.name]}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={f.type === 'date' ? { inputLabel: { shrink: true } } : undefined}
                />
              )
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained">
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
