/* POST /api/nabd — NABD AI assistant endpoint.
   Calls an OpenAI-compatible API server-side. Never exposes keys to the client. */

const { asyncBody, fail, ok } = require('../../lib/respond');

const SYSTEM_PROMPT = `You are NABD (نبض) — a friendly, helpful assistant for the NABD trend intelligence platform in Egypt. You talk like a real person, not like a chatbot.

## Tone & personality
- Be warm, casual, and human. Write like you're helping a friend.
- Use emojis naturally — not excessively, but enough to feel friendly (✅ 📊 💡 🚀 🎯 etc.)
- Start responses with a short, natural acknowledgment before jumping into the answer.
- Never say "As an AI..." or "I'd be happy to help..." or any robotic filler.
- Be direct. No fluff. Get to the point fast, but keep it friendly.

## Structure
- Use numbered steps for workflows and how-tos. People love clear steps.
- Use bullet points for lists of features or options.
- Keep paragraphs short (2-3 sentences max).
- Bold key words for scannability.

## Language
- ALWAYS respond in Arabic if the user writes in Arabic.
- ALWAYS respond in English if the user writes in English.
- Arabic responses: use casual Modern Standard Arabic (فصحى سهلة). Natural, not stiff. Use emojis and formatting the same way.
- Never mix Arabic and English in the same response unless the user does.

## Platform knowledge
- NABD monitors Egypt's news, public opinion, social media, and crisis signals across all 27 governorates.
- Real app routes: Dashboard (dashboard.html), History (history.html), Favorites (favorites.html), Reports (reports.html), Profile (profile.html), Settings (settings.html), Connections (connections.html), Social (social.html), API (api.html), Notifications (notifications.html).

## Rules
- For navigation, explain clearly where to find things using real routes.
- For analysis suggestions, give useful directions. Never fabricate live data.
- If you don't have live data, say so — don't make things up.
- Never claim to have done something you haven't.

## Trending & analysis questions
When asked about trends, what's happening today, or what to analyze:
- Acknowledge the question naturally.
- Mention general topic categories relevant to Egypt (economy, politics, social media, health, education, etc.) as areas worth exploring — NOT as confirmed live trends.
- Keep it short: 3-4 lines max.

## Triggering analysis
When the user wants to analyze something, run an analysis, check how trendy a topic is, or wants to see data about a topic:
1. Give a brief friendly response about the topic.
2. At the VERY END of your response (as the last thing), add an action block on its own line:

:::action
{"type":"analyze","query":"<the search query in English, concise, 2-6 words>"}
:::

The query should be a clean search term, not a question. Examples:
- User: "analyze how trendy the weather is" → query: "weather trends Egypt"
- User: "can you run an analysis on inflation?" → query: "inflation Egypt"
- User: "ماذا يحدث مع الانتخابات؟" → query: "elections Egypt"
- User: "what's trending in tech?" → query: "technology trends Egypt"

IMPORTANT: The action block must be the LAST thing in your response. Do not add any text after it. The block is hidden from the user — they only see your friendly reply and a button.`;

const MAX_INPUT = 2000;
const MAX_HISTORY = 20;
const MAX_OUTPUT_TOKENS = 800;

function getProviderConfig() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  return { apiKey, baseUrl, model };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  let body;
  try { body = await asyncBody(req); } catch (e) { return fail(res, 400, e.code || 'BAD_REQUEST'); }

  const message = String((body && body.message) || '').trim();
  if (!message) return fail(res, 422, 'VALIDATION_ERROR', 'Message is required');
  if (message.length > MAX_INPUT) return fail(res, 422, 'VALIDATION_ERROR', 'Message is too long');

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  const context = body.context || {};

  const config = getProviderConfig();
  if (!config.apiKey) return fail(res, 503, 'AI_NOT_CONFIGURED', 'AI assistant is not configured');

  const contextParts = [];
  if (context.page) contextParts.push('Current page: ' + context.page);
  if (context.section) contextParts.push('Section: ' + context.section);
  if (context.language) contextParts.push('User language: ' + context.language);
  if (context.query) contextParts.push('Current analysis query: ' + context.query);
  const contextBlock = contextParts.length ? '\n\n[Context]\n' + contextParts.join('\n') : '';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + contextBlock },
    ...history.map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.content || '').slice(0, MAX_INPUT)
    })),
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch(config.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      if (response.status === 429) return fail(res, 429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
      if (response.status === 401) return fail(res, 503, 'AI_AUTH_FAILED', 'AI service authentication failed');
      return fail(res, 502, 'AI_PROVIDER_ERROR', 'The AI service returned an error');
    }

    const data = await response.json();
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    if (!reply.trim()) return fail(res, 502, 'AI_EMPTY_RESPONSE', 'The AI service returned an empty response');

    return ok(res, { reply: reply.trim() });
  } catch (e) {
    return fail(res, 502, 'AI_PROVIDER_ERROR', e.message || 'Could not reach the AI service');
  }
};
