const fs = require('fs');

const WF = process.env.NABD_WORKFLOW_PATH || 'C:/Users/lunal/Downloads/توب علينا بقى.json';

if (!fs.existsSync(WF)) {
  console.log('SKIP: workflow file not found at ' + WF);
  process.exit(0);
}

const wf = JSON.parse(fs.readFileSync(WF, 'utf8'));
const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};
const node = (name) => wf.nodes.find((n) => n.name === name);

// ---- workflow wiring ----
const news = node('News API Search1');
const q = news.parameters.queryParameters.parameters.find((p) => p.name === 'q');
assert(q.value === '={{ $json.expandedQuery }}', 'NewsAPI q uses single-equals expression');

const ai = node('AI Intelligence Analyst');
assert(ai.parameters.text.includes('aiInput'), 'AI prompt receives the full aiInput array');
assert(!ai.parameters.text.includes('slice(0, 8)'), 'AI no longer receives only the first 8 signals');
assert(ai.onError === 'continueRegularOutput', 'AI node continues on parser error');

const validation = node('Post-AI Validation');
assert(!!validation, 'Post-AI Validation node exists');
assert(validation.type === 'n8n-nodes-base.code', 'Post-AI Validation is a Code node');
assert(wf.connections['AI Intelligence Analyst'].main[0][0].node === 'Post-AI Validation', 'AI -> Post-AI Validation connected');
assert(wf.connections['Post-AI Validation'].main[0][0].node === 'Respond to Dashboard', 'Post-AI Validation -> Respond to Dashboard connected');

// ---- simulate the validation logic ----
const jsCode = validation.parameters.jsCode;

function runNode(agg, aiOutput) {
  const $ = () => ({ first: () => ({ json: agg }) });
  const $input = { all: () => [] };
  const fn = new Function('$input', '$', '$json', jsCode);
  const result = fn($input, $, aiOutput);
  return result[0].json;
}

const makeArticles = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, title: 'خبر ' + (i + 1), description: 'وصف', source: 'مصدر', provider: 'SerpApi', publishedAt: '2026-08-10', url: 'https://x/' + i, relevance: 90, freshness: 90, score: 90, isRecent: true }));

// Scenario 1: 25 articles, AI guessed 8
{
  const out = runNode({ query: 'حادثة التجمع', aiInput: makeArticles(25) }, {
    output: {
      query: 'حادثة التجمع',
      stats: { totalPosts: 8, activeTopics: 1, sentimentScore: 0 },
      sentiment: { positive: 30, neutral: 30, negative: 40, label: 'Negative' },
      trendingTopics: [{ rank: 1, topic: 'جريمة قتل أسرة التجمع الخامس', count: 20, severity: 'high' }],
      aiBrief: { headline: 'قتل أسرة في التجمع الخامس', summary: 'ملخص', keyDevelopments: ['تطور 1'], whyItMatters: 'أهمية', confidence: 85 },
      aiHighlights: [{ type: 'MAJOR DEVELOPMENT', title: 'عنوان', detail: 'تفاصيل', confidence: 90 }],
      topLocations: [{ name: 'New Cairo', count: 20 }]
    }
  });
  assert(out.stats.totalPosts === 25, 'totalPosts forced to aiInput.length (25), not AI guess (8)');
  assert(out.stats.activeTopics === 1, 'activeTopics kept from AI (semantic)');
  assert(out.stats.sentimentScore === -10, 'sentimentScore recomputed as positive - negative (-10)');
  const sum = out.sentiment.positive + out.sentiment.neutral + out.sentiment.negative;
  assert(sum === 100 && out.sentiment.label === 'Negative', 'sentiment sums to 100 with label preserved');
  assert(out.trendingTopics[0].topic === 'جريمة قتل أسرة التجمع الخامس', 'trendingTopics preserved');
  assert(out.aiBrief.headline === 'قتل أسرة في التجمع الخامس', 'aiBrief preserved');
  assert(out.aiHighlights.length === 1 && out.topLocations[0].name === 'New Cairo', 'highlights/locations preserved');
}

// Scenario 2: AI returned raw fenced text (parser fallback)
{
  const payload = { query: 'حادثة التجمع', stats: { totalPosts: 1, activeTopics: 1, sentimentScore: 50 }, sentiment: { positive: 70, neutral: 10, negative: 20, label: 'Positive' }, trendingTopics: [], aiBrief: { headline: 'x', summary: '', keyDevelopments: [], whyItMatters: '', confidence: 50 }, aiHighlights: [], topLocations: [] };
  const out = runNode({ query: 'حادثة التجمع', aiInput: makeArticles(12) }, { text: '```json\n' + JSON.stringify(payload) + '\n```' });
  assert(out.stats.totalPosts === 12, 'fenced text payload extracted, totalPosts = 12');
  const s = out.sentiment.positive + out.sentiment.neutral + out.sentiment.negative;
  assert(s === 100 && out.stats.sentimentScore === 50, 'fenced path: sentiment normalized (100) and score = 50');
}

// Scenario 3: empty aiInput
{
  const out = runNode({ query: 'عمرو عمارة', aiInput: [] }, {
    output: { query: 'عمرو عمارة', stats: { totalPosts: 5, activeTopics: 2, sentimentScore: -10 }, sentiment: { positive: 10, neutral: 50, negative: 40, label: 'Negative' }, trendingTopics: [{ rank: 1, topic: 't', count: 1, severity: 'low' }], aiBrief: {}, aiHighlights: [], topLocations: [] }
  });
  assert(out.stats.totalPosts === 0 && out.stats.activeTopics === 0, 'empty aiInput -> totalPosts 0, activeTopics 0');
  assert(out.sentiment.positive === 0 && out.sentiment.neutral === 100 && out.sentiment.negative === 0 && out.sentiment.label === 'Neutral', 'empty aiInput -> neutral 100 sentiment');
  assert(out.stats.sentimentScore === 0, 'empty aiInput -> sentimentScore 0');
}

// Scenario 4: parser error output
{
  const out = runNode({ query: 'x', aiInput: makeArticles(3) }, { error: { message: 'parse failed' } });
  assert(out.stats.totalPosts === 3, 'parser failure still yields correct totalPosts (3)');
  assert(out.trendingTopics.length === 0 && out.aiHighlights.length === 0, 'parser failure yields clean empty semantic arrays');
}

// Scenario 5: non-round percentages normalized to sum 100
{
  const out = runNode({ query: 'x', aiInput: makeArticles(2) }, {
    output: { query: 'x', stats: { totalPosts: 2, activeTopics: 1, sentimentScore: 0 }, sentiment: { positive: 33, neutral: 33, negative: 33, label: 'Neutral' }, trendingTopics: [], aiBrief: {}, aiHighlights: [], topLocations: [] }
  });
  const sum = out.sentiment.positive + out.sentiment.neutral + out.sentiment.negative;
  assert(sum === 100, '33/33/33 normalized to exactly 100');
}

console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
