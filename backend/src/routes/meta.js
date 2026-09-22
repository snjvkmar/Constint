import { Router } from 'express';
import { NODE_SCHEMAS, EDGE_SCHEMAS } from '../schema.js';

const router = Router();

// GET /api/meta/schema — node/edge type definitions used to render dynamic forms
router.get('/schema', (req, res) => {
  res.json({ nodeSchemas: NODE_SCHEMAS, edgeSchemas: EDGE_SCHEMAS });
});

export default router;
