import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodesRouter from './routes/nodes.js';
import edgesRouter from './routes/edges.js';
import graphRouter from './routes/graph.js';
import metaRouter from './routes/meta.js';
import { closeDriver } from './db/neo4j.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/nodes', nodesRouter);
app.use('/api/edges', edgesRouter);
app.use('/api/graph', graphRouter);
app.use('/api/meta', metaRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Constint API listening on port ${PORT}`));

async function shutdown() {
  server.close();
  await closeDriver();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
