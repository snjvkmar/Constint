import { Router } from 'express';
import neo4j from 'neo4j-driver';
import { getSession } from '../db/neo4j.js';
import { ALLOWED_LABELS } from '../schema.js';
import { nodeToJson } from '../util/serialize.js';

const router = Router();

function assertValidLabel(label) {
  if (!ALLOWED_LABELS.includes(label)) {
    const err = new Error(`Invalid label "${label}". Allowed: ${ALLOWED_LABELS.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

// GET /api/nodes?label=Project&search=foo
router.get('/', async (req, res, next) => {
  const { label, search } = req.query;
  const session = getSession(neo4j.session.READ);
  try {
    const params = {};
    let query;
    if (label) {
      assertValidLabel(label);
      query = `MATCH (n:${label})`;
    } else {
      query = 'MATCH (n) WHERE any(l IN labels(n) WHERE l IN $allowed)';
      params.allowed = ALLOWED_LABELS;
    }
    if (search) {
      query += (query.includes('WHERE') ? ' AND ' : ' WHERE ') + 'toLower(n.name) CONTAINS toLower($search)';
      params.search = search;
    }
    query += ' RETURN n ORDER BY n.name';
    const result = await session.run(query, params);
    res.json(result.records.map((r) => nodeToJson(r.get('n'))));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// GET /api/nodes/:id
router.get('/:id', async (req, res, next) => {
  const session = getSession(neo4j.session.READ);
  try {
    const result = await session.run('MATCH (n) WHERE elementId(n) = $id RETURN n', { id: req.params.id });
    if (!result.records.length) return res.status(404).json({ error: 'Node not found' });
    res.json(nodeToJson(result.records[0].get('n')));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// POST /api/nodes  { label, properties }
router.post('/', async (req, res, next) => {
  const { label, properties = {} } = req.body;
  const session = getSession();
  try {
    assertValidLabel(label);
    const result = await session.run(
      `CREATE (n:${label}) SET n = $props, n.id = randomUUID(), n.createdAt = datetime() RETURN n`,
      { props: properties }
    );
    res.status(201).json(nodeToJson(result.records[0].get('n')));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// PUT /api/nodes/:id  { properties }
router.put('/:id', async (req, res, next) => {
  const { properties = {} } = req.body;
  const session = getSession();
  try {
    const result = await session.run(
      'MATCH (n) WHERE elementId(n) = $id SET n += $props, n.updatedAt = datetime() RETURN n',
      { id: req.params.id, props: properties }
    );
    if (!result.records.length) return res.status(404).json({ error: 'Node not found' });
    res.json(nodeToJson(result.records[0].get('n')));
  } catch (e) {
    next(e);
  } finally {
    await session.close();
  }
});

// DELETE /api/nodes/:id (detaches and removes all its relationships too)
router.delete('/:id', async (req, res, next) => {
  const session = getSession();
  try {
    const result = await session.run(
      'MATCH (n) WHERE elementId(n) = $id DETACH DELETE n RETURN count(n) AS deleted',
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
