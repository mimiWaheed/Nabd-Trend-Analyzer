/* GET /api/auth/me — current session user. */

const { requireAuth } = require('../_lib/auth');
const { ok, fail } = require('../_lib/respond');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  const auth = await requireAuth(req, res);
  if (!auth) return;
  return ok(res, { user: auth.public });
};
