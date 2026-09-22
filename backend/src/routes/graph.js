import { Router } from 'express';
import neo4j from 'neo4j-driver';
import { getSession } from '../db/neo4j.js';
import { ALLOWED_LABELS, ALLOWED_REL_TYPES } from '../schema.js';
import { nodeToJson, edgeToJson } from '../util/serialize.js';

const router = Router();

// GET /api/graph — full node + edge set, for populating the visualizer
router.get('/', async (req, res, next) => {
  const session = getSession(neo4j.session.READ);
  try {
    const nodesResult = await session.run(
      'MATCH (n) WHERE any(l IN labels(n) WHERE l IN $allowed) RETURN n',
      { allowed: ALLOWED_LABELS }
    );
    const edgesResult = await session.run(
      'MATCH (a)-[r]->(b) WHERE type(r) IN $allowedRel RETURN r',
      { allowedRel: ALLOWED_REL_TYPES }
    );
    res.json({
      nodes: nodesResult.records.map((rec) => nodeToJson(rec.get('n'))),
      edges: edgesResult.records.map((rec) => edgeToJson(rec.get('r'))),
    });
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

export default router;
