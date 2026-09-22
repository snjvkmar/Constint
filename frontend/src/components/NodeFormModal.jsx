import { useState } from 'react';
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
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{mode === 'edit' ? 'Edit Node' : 'Create Node'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              label="Type"
              value={label}
              disabled={mode === 'edit'}
              onChange={(e) => handleLabelChange(e.target.value)}
              fullWidth
              size="small"
            >
              {labels.map((l) => (
                <MenuItem key={l} value={l}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            {fields.map((f) =>
              f.type === 'enum' ? (
                <TextField
                  key={f.name}
                  select
                  label={f.label}
                  required={f.required}
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
                  required={f.required}
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
