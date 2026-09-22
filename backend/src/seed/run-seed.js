import 'dotenv/config';
import { driver, closeDriver } from '../db/neo4j.js';
import { assets, projects, cables, campaigns, tests, relationships } from './data.js';

async function createNodes(session, label, items) {
  for (const item of items) {
    await session.run(
      `CREATE (n:${label}) SET n = $props, n.id = randomUUID(), n.createdAt = datetime()`,
      { props: item }
    );
  }
  console.log(`  created ${items.length} :${label} nodes`);
}

async function run() {
  const session = driver.session();
  try {
    console.log('Clearing existing graph...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Creating uniqueness constraints...');
    for (const label of ['Project', 'Asset', 'Cable', 'Campaign', 'Test']) {
      await session.run(`CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`);
    }

    console.log('Creating nodes...');
    await createNodes(session, 'Asset', assets);
    await createNodes(session, 'Project', projects);
    await createNodes(session, 'Cable', cables);
    await createNodes(session, 'Campaign', campaigns);
    await createNodes(session, 'Test', tests);

    console.log('Creating relationships...');
    for (const rel of relationships) {
      const result = await session.run(
        `MATCH (a {name: $sourceName}), (b {name: $targetName})
         CREATE (a)-[r:${rel.type}]->(b)
         SET r = $props, r.id = randomUUID(), r.createdAt = datetime()`,
        { sourceName: rel.source, targetName: rel.target, props: rel.properties || {} }
      );
      if (result.summary.counters.updates().relationshipsCreated !== 1) {
        console.warn(`  WARNING: relationship not created for ${rel.type} ${rel.source} -> ${rel.target}`);
      }
    }
    console.log(`  created ${relationships.length} relationships`);
    console.log('Seed complete.');
  } finally {
    await session.close();
    await closeDriver();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
