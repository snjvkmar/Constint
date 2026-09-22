import { Router } from 'express';
import neo4j from 'neo4j-driver';
import { getSession } from '../db/neo4j.js';
import { ALLOWED_REL_TYPES, EDGE_SCHEMAS } from '../schema.js';
import { edgeToJson } from '../util/serialize.js';

const router = Router();

function assertValidType(type) {
  if (!ALLOWED_REL_TYPES.includes(type)) {
    const err = new Error(`Invalid relationship type "${type}". Allowed: ${ALLOWED_REL_TYPES.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

// GET /api/edges
router.get('/', async (req, res, next) => {
  const session = getSession(neo4j.session.READ);
  try {
    const result = await session.run(
      'MATCH (a)-[r]->(b) WHERE type(r) IN $allowed RETURN r',
      { allowed: ALLOWED_REL_TYPES }
    );
    res.json(result.records.map((rec) => edgeToJson(rec.get('r'))));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// POST /api/edges  { sourceId, targetId, type, properties }
router.post('/', async (req, res, next) => {
  const { sourceId, targetId, type, properties = {} } = req.body;
  const session = getSession();
  try {
    assertValidType(type);
    const nodesResult = await session.run(
      'MATCH (a), (b) WHERE elementId(a) = $sourceId AND elementId(b) = $targetId RETURN labels(a) AS aLabels, labels(b) AS bLabels',
      { sourceId, targetId }
    );
    if (!nodesResult.records.length) {
      return res.status(404).json({ error: 'Source or target node not found' });
    }
    const { allowedPairs } = EDGE_SCHEMAS[type];
    if (allowedPairs) {
      const aLabels = nodesResult.records[0].get('aLabels');
      const bLabels = nodesResult.records[0].get('bLabels');
      const ok = allowedPairs.some(([sl, tl]) => aLabels.includes(sl) && bLabels.includes(tl));
      if (!ok) {
        return res.status(400).json({
          error: `Relationship "${type}" is not allowed between ${aLabels.join(',')} and ${bLabels.join(',')}`,
        });
      }
    }
    const result = await session.run(
      `MATCH (a), (b) WHERE elementId(a) = $sourceId AND elementId(b) = $targetId
       CREATE (a)-[r:${type}]->(b)
       SET r = $props, r.id = randomUUID(), r.createdAt = datetime()
       RETURN r`,
      { sourceId, targetId, props: properties }
    );
    res.status(201).json(edgeToJson(result.records[0].get('r')));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// PUT /api/edges/:id  { properties }
router.put('/:id', async (req, res, next) => {
  const { properties = {} } = req.body;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH ()-[r]->() WHERE elementId(r) = $id
       SET r += $props, r.updatedAt = datetime()
       RETURN r`,
      { id: req.params.id, props: properties }
    );
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' });
    res.json(edgeToJson(result.records[0].get('r')));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// DELETE /api/edges/:id
router.delete('/:id', async (req, res, next) => {
  const session = getSession();
  try {
    const result = await session.run(
      'MATCH ()-[r]->() WHERE elementId(r) = $id DELETE r RETURN count(r) AS deleted',
      { id: req.params.id }
    );
    res.json({ deleted: result.records[0].get('deleted').toNumber() });
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

export default router;
