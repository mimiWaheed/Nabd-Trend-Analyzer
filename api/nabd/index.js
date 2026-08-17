/* POST /api/nabd — NABD AI assistant endpoint.
   Calls an OpenAI-compatible API server-side. Never exposes keys to the client. */

const { asyncBody, fail, ok } = require('../../lib/respond');

const SYSTEM_PROMPT = `You are NABD (نبض) — the intelligent assistant of the NABD trend intelligence platform for Egypt.

## Response style
- Be helpful, friendly, and professional — like a knowledgeable colleague, not a robot.
- Keep responses concise and well-structured. Use short paragraphs, bullet points, and headers when appropriate.
- Use plain language anyone can understand. Avoid jargon unless the user is technical.
- Be approachable: acknowledge what the user asked, then answer directly.

## Language
- ALWAYS respond in Arabic if the user writes in Arabic.
- ALWAYS respond in English if the user writes in English.
- For Arabic responses: use Modern Standard Arabic (فصحى), natural and easy to read. Use markdown formatting (headers, bullets) just like in English.
- Never mix Arabic and English in the same response unless the user does so first.

## Platform knowledge
- NABD monitors Egypt's news, public opinion, social media, and crisis signals across all 27 governorates.
- It turns raw signals into plain-language briefs.
- Real app routes: Dashboard (dashboard.html), History (history.html), Favorites (favorites.html), Reports (reports.html), Profile (profile.html), Settings (settings.html), Connections (connections.html), Social (social.html), API (api.html), Notifications (notifications.html).

## Rules
- For navigation questions, explain clearly where to find things using the real routes above.
- For product questions, explain NABD capabilities clearly and concisely.
- For analysis suggestions, give useful directions. Never fabricate live trend data.
- If you don't have live trend data, say so instead of inventing information.
- Never claim to have performed an action you did not perform.`;

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
