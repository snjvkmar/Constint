import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import LinkIcon from '@mui/icons-material/Link';

const LAYOUTS = ['cose-bilkent', 'breadthfirst', 'concentric', 'grid', 'circle'];

function TypeRow({ color, name, count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
      {color && (
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      )}
      <Typography variant="body2" sx={{ flex: 1 }}>
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {count}
      </Typography>
    </Box>
  );
}

export default function Sidebar({
  nodeSchemas,
  edgeSchemas,
  visibleLabels,
  onToggleLabel,
  visibleRelTypes,
  onToggleRelType,
  searchTerm,
  onSearchChange,
  onCreateNode,
  onCreateEdge,
  linkMode,
  onToggleLinkMode,
  layoutName,
  onLayoutChange,
  nodeCounts,
  edgeCounts,
}) {
  const labels = Object.keys(nodeSchemas);
  const relTypes = Object.keys(edgeSchemas);

  return (
    <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
      <Typography variant="overline" color="text.secondary">
        Search
      </Typography>
      <TextField
        fullWidth
        size="small"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3, mt: 1 }}
      />

      <Typography variant="overline" color="text.secondary">
        Node Types
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {labels.map((label) => (
          <FormControlLabel
            key={label}
            sx={{ mr: 0, width: '100%' }}
            control={
              <Checkbox
                size="small"
                checked={visibleLabels.has(label)}
                onChange={() => onToggleLabel(label)}
                sx={{ color: nodeSchemas[label].color, '&.Mui-checked': { color: nodeSchemas[label].color } }}
              />
            }
            label={<TypeRow color={nodeSchemas[label].color} name={label} count={nodeCounts[label] || 0} />}
          />
        ))}
      </FormGroup>

      <Typography variant="overline" color="text.secondary">
        Relationship Types
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {relTypes.map((type) => (
          <FormControlLabel
            key={type}
            sx={{ mr: 0, width: '100%' }}
            control={
              <Checkbox size="small" checked={visibleRelTypes.has(type)} onChange={() => onToggleRelType(type)} />
            }
            label={<TypeRow name={edgeSchemas[type].label} count={edgeCounts[type] || 0} />}
          />
        ))}
      </FormGroup>

      <Divider sx={{ mb: 3 }} />

      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel id="layout-label">Layout</InputLabel>
        <Select
          labelId="layout-label"
          label="Layout"
          value={layoutName}
          onChange={(e) => onLayoutChange(e.target.value)}
        >
          {LAYOUTS.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack spacing={1}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreateNode}>
          Add Node
        </Button>
        <Button variant="outlined" startIcon={<CallSplitIcon />} onClick={onCreateEdge}>
          Add Dependency
        </Button>
        <Button
          variant={linkMode ? 'contained' : 'outlined'}
          color="primary"
          startIcon={<LinkIcon />}
          onClick={onToggleLinkMode}
        >
          {linkMode ? 'Click two nodes… (cancel)' : 'Link Mode'}
        </Button>
      </Stack>
    </Box>
  );
}
