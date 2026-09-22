// Central definition of the graph's node/relationship types, their allowed
// attributes, and (for relationships) which node-label pairs they may connect.
// This is the single source of truth used by the API routes (for validation)
// and served to the frontend via GET /api/meta/schema so forms can be built
// dynamically instead of hardcoding UI per entity type.

export const NODE_SCHEMAS = {
  Project: {
    label: 'Project',
    color: '#2563eb',
    shape: 'ellipse',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'region', label: 'Region', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        options: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
      },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'budgetUsd', label: 'Budget (USD)', type: 'number' },
      { name: 'projectManager', label: 'Project Manager', type: 'text' },
    ],
  },
  Asset: {
    label: 'Asset',
    color: '#f97316',
    shape: 'round-rectangle',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'assetType',
        label: 'Asset Type',
        type: 'enum',
        options: [
          'Cable-Lay Vessel',
          'Survey Vessel',
          'ROV Support Vessel',
          'Burial Vessel',
          'Storage Barge',
          'Manufacturing Plant',
          'Warehouse',
        ],
      },
      { name: 'owner', label: 'Owner', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'capacity', label: 'Capacity', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        options: ['Available', 'In Use', 'Maintenance', 'Retired'],
      },
      { name: 'dayRateUsd', label: 'Day Rate (USD)', type: 'number' },
    ],
  },
  Cable: {
    label: 'Cable',
    color: '#16a34a',
    shape: 'triangle',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'cableType',
        label: 'Cable Type',
        type: 'enum',
        options: ['HVDC', 'HVAC', 'Fiber Optic Telecom', 'Umbilical'],
      },
      { name: 'voltageKv', label: 'Voltage (kV)', type: 'number' },
      { name: 'lengthKm', label: 'Length (km)', type: 'number' },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        options: ['Design', 'Manufacturing', 'Shipped', 'Installed', 'Commissioned'],
      },
    ],
  },
  Campaign: {
    label: 'Campaign',
    color: '#9333ea',
    shape: 'hexagon',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'campaignType',
        label: 'Campaign Type',
        type: 'enum',
        options: ['Route Survey', 'Cable Installation', 'Burial', 'Testing & Commissioning', 'Maintenance'],
      },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        options: ['Planned', 'In Progress', 'Completed', 'Delayed'],
      },
      { name: 'location', label: 'Location', type: 'text' },
    ],
  },
  Test: {
    label: 'Test',
    color: '#dc2626',
    shape: 'diamond',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'testType',
        label: 'Test Type',
        type: 'enum',
        options: [
          'Factory Acceptance Test',
          'High Voltage Test',
          'Mechanical Load Test',
          'Environmental Test',
          'Electrical Continuity Test',
        ],
      },
      { name: 'standard', label: 'Standard', type: 'text' },
      { name: 'result', label: 'Result', type: 'enum', options: ['Pass', 'Fail', 'Pending'] },
      { name: 'testDate', label: 'Test Date', type: 'date' },
      { name: 'engineer', label: 'Engineer', type: 'text' },
    ],
  },
};

export const EDGE_SCHEMAS = {
  USES_ASSET: {
    type: 'USES_ASSET',
    label: 'Uses Asset',
    allowedPairs: [
      ['Project', 'Asset'],
      ['Campaign', 'Asset'],
    ],
    fields: [
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'allocationPercent', label: 'Allocation %', type: 'number' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
    ],
  },
  INCLUDES_CABLE: {
    type: 'INCLUDES_CABLE',
    label: 'Includes Cable',
    allowedPairs: [['Project', 'Cable']],
    fields: [],
  },
  INCLUDES_CAMPAIGN: {
    type: 'INCLUDES_CAMPAIGN',
    label: 'Includes Campaign',
    allowedPairs: [['Project', 'Campaign']],
    fields: [],
  },
  INCLUDES_TEST: {
    type: 'INCLUDES_TEST',
    label: 'Includes Test',
    allowedPairs: [['Campaign', 'Test']],
    fields: [],
  },
  TESTED_BY: {
    type: 'TESTED_BY',
    label: 'Tested By',
    allowedPairs: [['Cable', 'Test']],
    fields: [],
  },
  INSTALLED_IN: {
    type: 'INSTALLED_IN',
    label: 'Installed In',
    allowedPairs: [['Cable', 'Campaign']],
    fields: [],
  },
  DEPENDS_ON: {
    type: 'DEPENDS_ON',
    label: 'Depends On',
    allowedPairs: null,
    fields: [
      { name: 'reason', label: 'Reason', type: 'text' },
      { name: 'criticality', label: 'Criticality', type: 'enum', options: ['Low', 'Medium', 'High', 'Critical'] },
    ],
  },
  PART_OF: {
    type: 'PART_OF',
    label: 'Part Of',
    allowedPairs: [['Asset', 'Asset']],
    fields: [{ name: 'reason', label: 'Reason', type: 'text' }],
  },
};

export const ALLOWED_LABELS = Object.keys(NODE_SCHEMAS);
export const ALLOWED_REL_TYPES = Object.keys(EDGE_SCHEMAS);
