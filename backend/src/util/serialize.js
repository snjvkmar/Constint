export function nodeToJson(node) {
  return {
    id: node.elementId,
    labels: node.labels,
    properties: node.properties,
  };
}

export function edgeToJson(rel) {
  return {
    id: rel.elementId,
    type: rel.type,
    startNodeId: rel.startNodeElementId,
    endNodeId: rel.endNodeElementId,
    properties: rel.properties,
  };
}
