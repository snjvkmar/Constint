import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HubIcon from '@mui/icons-material/Hub';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const HIDDEN_NODE_KEYS = ['name', 'id', 'createdAt', 'updatedAt'];
const HIDDEN_EDGE_KEYS = ['id', 'createdAt', 'updatedAt'];

function PropTable({ properties, hiddenKeys }) {
  const entries = Object.entries(properties).filter(([k]) => !hiddenKeys.includes(k));
  if (!entries.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No additional attributes set.
      </Typography>
    );
  }
  return (
    <Table size="small">
      <TableBody>
        {entries.map(([k, v]) => (
          <TableRow key={k} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{ pl: 0, color: 'text.secondary', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
              {k}
            </TableCell>
            <TableCell sx={{ pr: 0, wordBreak: 'break-word' }}>{String(v)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function DetailsPanel({ selected, focus, nodeSchemas, edgeSchemas, onEdit, onDelete, onFocus, onClearFocus, onClose }) {
  if (!selected) {
    return (
      <Box sx={{ p: 2.5, height: '100%' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" color="text.secondary">
          <InfoOutlinedIcon fontSize="small" sx={{ mt: 0.3 }} />
          <Typography variant="body2">Select a node or dependency to view details.</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Tip: use "Link Mode" then click two nodes to quickly create a dependency between them. Select a node or
          edge and choose "Show only connected" to isolate its neighborhood.
        </Typography>
        {focus && (
          <Button size="small" onClick={onClearFocus} sx={{ mt: 2 }}>
            Show all (clear isolation)
          </Button>
        )}
      </Box>
    );
  }

  const isFocused = focus && focus.kind === selected.kind && focus.id === selected.data.id;

  if (selected.kind === 'node') {
    const node = selected.data;
    const primaryLabel = node.labels[0];
    const schema = nodeSchemas[primaryLabel];
    return (
      <Box sx={{ p: 2.5, height: '100%' }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Chip label={primaryLabel} size="small" sx={{ bgcolor: schema?.color, color: '#fff', fontWeight: 600 }} />
          <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography variant="h6" sx={{ mb: 1.5, wordBreak: 'break-word' }}>
          {node.properties.name}
        </Typography>
        <PropTable properties={node.properties} hiddenKeys={HIDDEN_NODE_KEYS} />
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          <Button
            size="small"
            variant={isFocused ? 'contained' : 'outlined'}
            startIcon={<HubIcon fontSize="small" />}
            onClick={() => (isFocused ? onClearFocus() : onFocus(selected))}
          >
            {isFocused ? 'Showing only connected — clear' : 'Show only connected'}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />} onClick={() => onEdit(selected)} sx={{ flex: 1 }}>
              Edit
            </Button>
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => onDelete(selected)} sx={{ flex: 1 }}>
              Delete
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  const edge = selected.data;
  const schema = edgeSchemas[edge.type];
  return (
    <Box sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
        <Chip label={schema?.label || edge.type} size="small" color="default" sx={{ fontWeight: 600 }} />
        <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <PropTable properties={edge.properties} hiddenKeys={HIDDEN_EDGE_KEYS} />
      <Divider sx={{ my: 2 }} />
      <Stack spacing={1}>
        <Button
          size="small"
          variant={isFocused ? 'contained' : 'outlined'}
          startIcon={<HubIcon fontSize="small" />}
          onClick={() => (isFocused ? onClearFocus() : onFocus(selected))}
        >
          {isFocused ? 'Showing only connected — clear' : 'Show only connected'}
        </Button>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />} onClick={() => onEdit(selected)} sx={{ flex: 1 }}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => onDelete(selected)} sx={{ flex: 1 }}>
            Delete
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
