import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'constint-password';

export const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export function getSession(mode = neo4j.session.WRITE) {
  return driver.session({ defaultAccessMode: mode });
}

export async function closeDriver() {
  await driver.close();
}
