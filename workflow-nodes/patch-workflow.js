const fs = require('fs');
const path = require('path');

const WF = 'C:/Users/lunal/Downloads/توب علينا بقى.json';
const POST_AI = path.join(__dirname, 'post-ai-validation.js');
const METRICS = path.join(__dirname, 'generate-dashboard-metrics.js');
const MERGE = path.join(__dirname, 'final-dashboard-merge.js');

const wf = JSON.parse(fs.readFileSync(WF, 'utf8'));
const readCode = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '\n');

const findNode = (name, required) => {
  const n = wf.nodes.find((x) => x.name === name);
  if (!n && required) throw new Error('node not found: ' + name);
  return n;
};

const report = [];

// 1) Fix the broken NewsAPI q expression (=={{...}}  ->  ={{...}})
const news = findNode('News API Search1', true);
const qParam = news.parameters.queryParameters.parameters.find((p) => p.name === 'q');
if (qParam.value === '=={{ $json.expandedQuery }}') {
  qParam.value = '={{ $json.expandedQuery }}';
  report.push('NewsAPI q fixed: =={{...}} -> ={{...}}');
} else if (qParam.value === '={{ $json.expandedQuery }}') {
  report.push('NewsAPI q already correct');
} else {
  throw new Error('Unexpected NewsAPI q value: ' + qParam.value);
}

// 2) ChainLlm: pass the FULL aiInput array to the model (was: first 8 signals)
const ai = findNode('AI Intelligence Analyst', true);
if (!ai.parameters.text.includes('aiInput')) {
  ai.parameters.text = `={{ JSON.stringify({
  query: $json.query,
  stats: $json.stats || {},
  aiInput: ($json.aiInput || []).map(r => ({
    id: r.id,
    title: String(r.title || "").slice(0, 160),
    source: String(r.source?.name || r.source || "").slice(0, 60),
    provider: String(r.provider || ""),
    publishedAt: String(r.publishedAt || ""),
    text: String(r.description || r.snippet || "").slice(0, 220)
  })),
  topLocations: ($json.topLocations || []),
  sourceDistribution: ($json.sourceDistribution || []).slice(0, 10)
}) }}`;
  report.push('AI prompt updated: full aiInput passed to model');
} else {
  report.push('AI prompt already passes aiInput');
}
if (ai.onError !== 'continueRegularOutput') {
  ai.onError = 'continueRegularOutput';
  report.push('AI node onError set to continueRegularOutput');
} else {
  report.push('AI node onError already continueRegularOutput');
}

// 3) Add / refresh the Post-AI Validation node (deterministic enforcement)
let validation = findNode('Post-AI Validation');
if (!validation) {
  wf.nodes.push({
    parameters: { jsCode: readCode(POST_AI) },
    id: 'a4c96e42-9f0d-4f5a-b3d2-7c8e91f2d6b0',
    name: 'Post-AI Validation',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-736, -176]
  });
  report.push('Post-AI Validation node added');
} else {
  validation.parameters.jsCode = readCode(POST_AI);
  report.push('Post-AI Validation node updated');
}

// 4) Add / refresh the Generate Dashboard Metrics node (deterministic analytics)
let metrics = findNode('Generate Dashboard Metrics');
if (!metrics) {
  wf.nodes.push({
    parameters: { jsCode: readCode(METRICS) },
    id: 'b7e1a2d3-4c5f-4a6e-9b8c-0d1e2f3a4b5c',
    name: 'Generate Dashboard Metrics',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-1040, -64]
  });
  report.push('Generate Dashboard Metrics node added');
} else {
  metrics.parameters.jsCode = readCode(METRICS);
  report.push('Generate Dashboard Metrics node updated');
}

// 5) Add / refresh the Final Dashboard Merge node (dashboard + intelligence + meta)
let merge = findNode('Final Dashboard Merge');
if (!merge) {
  wf.nodes.push({
    parameters: { jsCode: readCode(MERGE) },
    id: 'c9f0e1d2-3a4b-4c5d-8e6f-7a8b9c0d1e2f',
    name: 'Final Dashboard Merge',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-460, -176]
  });
  report.push('Final Dashboard Merge node added');
} else {
  merge.parameters.jsCode = readCode(MERGE);
  report.push('Final Dashboard Merge node updated');
}

// 6) Rewire connections
//    Aggregate Signals1 -> [AI Intelligence Analyst, Generate Dashboard Metrics]
//    AI Intelligence Analyst -> Post-AI Validation
//    Generate Dashboard Metrics -> Final Dashboard Merge (input 0)
//    Post-AI Validation -> Final Dashboard Merge (input 1)
//    Final Dashboard Merge -> Respond to Dashboard
const aggConn = wf.connections['Aggregate Signals1'] || { main: [[]] };
if (!aggConn.main) aggConn.main = [[]];
aggConn.main[0] = [
  { node: 'AI Intelligence Analyst', type: 'main', index: 0 },
  { node: 'Generate Dashboard Metrics', type: 'main', index: 0 }
];
wf.connections['Aggregate Signals1'] = aggConn;
report.push('Aggregate Signals1 -> AI + Generate Dashboard Metrics');

wf.connections['Generate Dashboard Metrics'] = {
  main: [[{ node: 'Final Dashboard Merge', type: 'main', index: 0 }]]
};
report.push('Generate Dashboard Metrics -> Final Dashboard Merge (input 0)');

wf.connections['Post-AI Validation'] = {
  main: [[{ node: 'Final Dashboard Merge', type: 'main', index: 1 }]]
};
report.push('Post-AI Validation -> Final Dashboard Merge (input 1)');

wf.connections['Final Dashboard Merge'] = {
  main: [[{ node: 'Respond to Dashboard', type: 'main', index: 0 }]]
};
report.push('Final Dashboard Merge -> Respond to Dashboard');

fs.writeFileSync(WF, JSON.stringify(wf, null, 2));
console.log('Workflow patched OK');
report.forEach((r) => console.log(' - ' + r));
