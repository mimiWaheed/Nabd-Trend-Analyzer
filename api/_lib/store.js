/* NABD — data layer (repository).
   Production uses PostgreSQL via `pg` (DATABASE_URL). Tests may force the
   in-memory implementation with NABD_DATA=memory so the same route handlers
   can be exercised without a live database.

   Every query is scoped by userId at the call site — the store never filters
   by a caller-supplied user id.
*/

const crypto = require('crypto');
const { randomToken, nowIso } = require('./crypto');

/* ------------------------------------------------------------------ */
/* In-memory implementation (tests / local static preview)             */
/* ------------------------------------------------------------------ */
function makeMemoryStore() {
  const db = {
    users: [],
    sessions: [],
    verifications: [],
    settings: [],
    searches: [],
    results: [],
    analyses: [],
    fb: [],
    oauthStates: [],
    activity: [],
    notifications: [],
    downloads: [],
    loginAttempts: []
  };

  const byId = (arr, id) => arr.find((r) => r.id === id);

  return {
    _mem: db,
    _reset() {
      Object.keys(db).forEach((k) => { db[k] = []; });
    },

    /* ---- users ---- */
    async createUser(u) {
      db.users.push(u);
      return Object.assign({}, u);
    },
    async findUserByEmail(email) {
      const u = db.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase());
      return u ? Object.assign({}, u) : null;
    },
    async findUserById(id) {
      const u = byId(db.users, id);
      return u ? Object.assign({}, u) : null;
    },
    async updateUser(id, patch) {
      const u = byId(db.users, id);
      if (!u) return null;
      Object.keys(patch).forEach((k) => {
        if (patch[k] !== undefined) u[k] = patch[k];
      });
      u.updatedAt = nowIso();
      return Object.assign({}, u);
    },

    /* ---- sessions ---- */
    async createSession(s) { db.sessions.push(s); return Object.assign({}, s); },
    async findSessionByTokenHash(h) {
      const s = db.sessions.find((x) => x.tokenHash === h && new Date(x.expiresAt) > new Date());
      return s ? Object.assign({}, s) : null;
    },
    async deleteSessionByTokenHash(h) {
      db.sessions = db.sessions.filter((x) => x.tokenHash !== h);
    },
    async deleteSessionsByUser(userId) {
      db.sessions = db.sessions.filter((x) => x.userId !== userId);
    },

    /* ---- email verifications ---- */
    async createVerification(v) { db.verifications.push(v); return Object.assign({}, v); },
    async findLatestVerificationByUser(userId) {
      const list = db.verifications.filter((x) => x.userId === userId);
      const v = list[list.length - 1] || null;
      return v ? Object.assign({}, v) : null;
    },
    async markVerificationUsed(id) {
      const v = byId(db.verifications, id);
      if (v) { v.usedAt = nowIso(); }
    },
    async incrementVerificationAttempts(id) {
      const v = byId(db.verifications, id);
      if (v) { v.attempts = (v.attempts || 0) + 1; }
    },
    async replaceVerification(id, patch) {
      const v = byId(db.verifications, id);
      if (!v) return null;
      Object.keys(patch).forEach((k) => { if (patch[k] !== undefined) v[k] = patch[k]; });
      return Object.assign({}, v);
    },

    /* ---- settings ---- */
    async getSettings(userId) {
      const s = db.settings.find((x) => x.userId === userId);
      return s ? Object.assign({}, { userId: s.userId, data: Object.assign({}, s.data), updatedAt: s.updatedAt }) : null;
    },
    async setSettings(userId, data) {
      const ix = db.settings.findIndex((x) => x.userId === userId);
      const rec = { userId, data: data || {}, updatedAt: nowIso() };
      if (ix === -1) db.settings.push(rec); else db.settings[ix] = rec;
      return Object.assign({}, rec);
    },

    /* ---- searches ---- */
    async createSearch(s) { db.searches.push(s); return Object.assign({}, s); },
    async updateSearch(id, patch) {
      const s = byId(db.searches, id);
      if (!s) return null;
      Object.keys(patch).forEach((k) => { if (patch[k] !== undefined) s[k] = patch[k]; });
      s.updatedAt = nowIso();
      return Object.assign({}, s);
    },
    async getSearch(id) {
      const s = byId(db.searches, id);
      return s ? Object.assign({}, s) : null;
    },
    async listSearches(userId, { limit, offset }) {
      return db.searches
        .filter((s) => s.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit)
        .map((s) => Object.assign({}, s));
    },
    async countSearches(userId) {
      return db.searches.filter((s) => s.userId === userId).length;
    },
    async deleteSearch(id) {
      db.searches = db.searches.filter((s) => s.id !== id);
      db.results = db.results.filter((r) => r.searchId !== id);
      db.analyses = db.analyses.filter((a) => a.searchId !== id);
      db.downloads = db.downloads.map((d) => (d.searchId === id ? Object.assign({}, d, { searchId: null, analysisId: null }) : d));
    },

    /* ---- results ---- */
    async insertResults(rows) { rows.forEach((r) => db.results.push(r)); },
    async listResultsBySearch(searchId) {
      return db.results
        .filter((r) => r.searchId === searchId)
        .sort((a, b) => (b.score != null ? b.score : 0) - (a.score != null ? a.score : 0))
        .map((r) => Object.assign({}, r));
    },
    async getAnalysisBySearch(searchId) {
      const a = db.analyses.find((x) => x.searchId === searchId);
      return a ? Object.assign({}, a) : null;
    },

    /* ---- analyses ---- */
    async createAnalysis(a) { db.analyses.push(a); return Object.assign({}, a); },
    async listAnalyses(userId, { limit }) {
      return db.analyses
        .filter((a) => a.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map((a) => Object.assign({}, a));
    },
    async countAnalyses(userId) {
      return db.analyses.filter((a) => a.userId === userId).length;
    },

    /* ---- facebook connections ---- */
    async getFb(userId) {
      const f = db.fb.find((x) => x.userId === userId);
      return f ? Object.assign({}, f) : null;
    },
    async upsertFb(rec) {
      const ix = db.fb.findIndex((x) => x.userId === rec.userId);
      const entry = Object.assign({}, rec, { updatedAt: nowIso() });
      if (ix === -1) db.fb.push(entry); else db.fb[ix] = entry;
      return Object.assign({}, entry);
    },
    async deleteFb(userId) {
      db.fb = db.fb.filter((x) => x.userId !== userId);
    },

    /* ---- oauth states ---- */
    async createOauthState(s) { db.oauthStates.push(s); return Object.assign({}, s); },
    async getOauthState(id) {
      const s = byId(db.oauthStates, id);
      return s ? Object.assign({}, s) : null;
    },
    async consumeOauthState(id) {
      const s = byId(db.oauthStates, id);
      if (s) s.usedAt = nowIso();
    },

    /* ---- activity ---- */
    async insertActivity(a) { db.activity.push(a); },
    async listActivity(userId, { limit }) {
      return db.activity
        .filter((a) => a.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map((a) => Object.assign({}, a));
    },

    /* ---- notifications ---- */
    async insertNotification(n) { db.notifications.push(n); return Object.assign({}, n); },
    async listNotifications(userId, { limit }) {
      return db.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map((n) => Object.assign({}, n));
    },
    async countUnreadNotifications(userId) {
      return db.notifications.filter((n) => n.userId === userId && !n.read).length;
    },
    async markNotificationRead(id, userId) {
      const n = byId(db.notifications, id);
      if (!n || n.userId !== userId) return null;
      n.read = true;
      return Object.assign({}, n);
    },
    async markAllNotificationsRead(userId) {
      db.notifications.forEach((n) => { if (n.userId === userId) n.read = true; });
    },

    /* ---- downloads ---- */
    async insertDownload(d) { db.downloads.push(d); return Object.assign({}, d); },
    async listDownloads(userId, { limit }) {
      return db.downloads
        .filter((d) => d.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map((d) => Object.assign({}, d));
    },
    async countDownloads(userId) {
      return db.downloads.filter((d) => d.userId === userId).length;
    },

    /* ---- login attempts ---- */
    async recordLoginAttempt(a) { db.loginAttempts.push(a); },
    async countRecentFailed(email, ip, since) {
      return db.loginAttempts.filter((a) =>
        !a.success &&
        a.email.toLowerCase() === String(email).toLowerCase() &&
        (a.ip === ip || !ip) &&
        new Date(a.createdAt) > new Date(since)
      ).length;
    }
  };
}

/* ------------------------------------------------------------------ */
/* PostgreSQL implementation                                           */
/* ------------------------------------------------------------------ */
function makePostgresStore(pool) {
  const q = async (text, params) => (await pool.query(text, params || [])).rows;
  const one = async (text, params) => (await pool.query(text, params || [])).rows[0] || null;

  return {
    async createUser(u) {
      return one(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, phone, organization, country, lang)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, first_name AS "firstName", last_name AS "lastName", email,
                   email_verified AS "emailVerified", phone, organization, country, lang,
                   created_at AS "createdAt", last_login_at AS "lastLoginAt"`,
        [u.id, u.firstName, u.lastName, u.email, u.passwordHash, u.phone || null, u.organization || null, u.country || null, u.lang || 'en']
      );
    },
    async findUserByEmail(email) {
      return one(
        `SELECT id, first_name AS "firstName", last_name AS "lastName", email, password_hash AS "passwordHash",
                email_verified AS "emailVerified", phone, organization, country, lang,
                created_at AS "createdAt", updated_at AS "updatedAt", last_login_at AS "lastLoginAt"
         FROM users WHERE lower(email) = lower($1)`, [email]);
    },
    async findUserById(id) {
      return one(
        `SELECT id, first_name AS "firstName", last_name AS "lastName", email, password_hash AS "passwordHash",
                email_verified AS "emailVerified", phone, organization, country, lang,
                created_at AS "createdAt", updated_at AS "updatedAt", last_login_at AS "lastLoginAt"
         FROM users WHERE id = $1`, [id]);
    },
    async updateUser(id, patch) {
      const fields = [];
      const params = [];
      const map = {
        firstName: 'first_name', lastName: 'last_name', phone: 'phone', organization: 'organization',
        country: 'country', lang: 'lang', emailVerified: 'email_verified', lastLoginAt: 'last_login_at'
      };
      Object.keys(patch).forEach((k) => {
        if (patch[k] === undefined || !map[k]) return;
        params.push(patch[k]);
        fields.push(map[k] + ' = $' + params.length);
      });
      if (!fields.length) return this.findUserById(id);
      params.push(id);
      const setClause = fields.join(', ') + ', updated_at = NOW()';
      return one(
        `UPDATE users SET ${setClause} WHERE id = $${params.length}
         RETURNING id, first_name AS "firstName", last_name AS "lastName", email,
                   email_verified AS "emailVerified", phone, organization, country, lang,
                   created_at AS "createdAt", updated_at AS "updatedAt", last_login_at AS "lastLoginAt"`,
        params
      );
    },

    async createSession(s) {
      await q(`INSERT INTO sessions (id, token_hash, user_id, expires_at, ip, user_agent)
               VALUES ($1,$2,$3,$4,$5,$6)`,
        [s.id, s.tokenHash, s.userId, s.expiresAt, s.ip || null, s.userAgent || null]);
      return Object.assign({}, s);
    },
    async findSessionByTokenHash(h) {
      return one(
        `SELECT id, token_hash AS "tokenHash", user_id AS "userId", expires_at AS "expiresAt",
                created_at AS "createdAt", ip, user_agent AS "userAgent"
         FROM sessions WHERE token_hash = $1 AND expires_at > NOW()`, [h]);
    },
    async deleteSessionByTokenHash(h) {
      await q(`DELETE FROM sessions WHERE token_hash = $1`, [h]);
    },
    async deleteSessionsByUser(userId) {
      await q(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    },

    async createVerification(v) {
      await q(`INSERT INTO email_verifications (id, user_id, otp_hash, expires_at, resend_at, max_attempts)
               VALUES ($1,$2,$3,$4,$5,$6)`,
        [v.id, v.userId, v.otpHash, v.expiresAt, v.resendAt || null, v.maxAttempts || 5]);
      return Object.assign({}, v);
    },
    async findLatestVerificationByUser(userId) {
      return one(
        `SELECT id, user_id AS "userId", otp_hash AS "otpHash", expires_at AS "expiresAt",
                attempts, max_attempts AS "maxAttempts", used_at AS "usedAt", resend_at AS "resendAt"
         FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
    },
    async markVerificationUsed(id) {
      await q(`UPDATE email_verifications SET used_at = NOW() WHERE id = $1`, [id]);
    },
    async incrementVerificationAttempts(id) {
      await q(`UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1`, [id]);
    },
    async replaceVerification(id, patch) {
      await q(`UPDATE email_verifications SET otp_hash = $1, expires_at = $2, resend_at = $3, attempts = 0, used_at = NULL WHERE id = $4`,
        [patch.otpHash, patch.expiresAt, patch.resendAt || null, id]);
      return this.findLatestVerificationByUser(patch.userId);
    },

    async getSettings(userId) {
      return one(`SELECT user_id AS "userId", data, updated_at AS "updatedAt" FROM settings WHERE user_id = $1`, [userId]);
    },
    async setSettings(userId, data) {
      return one(
        `INSERT INTO settings (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
         RETURNING user_id AS "userId", data, updated_at AS "updatedAt"`,
        [userId, JSON.stringify(data || {})]);
    },

    async createSearch(s) {
      return one(
        `INSERT INTO searches (id, user_id, query, scope, status, error, category, source_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, user_id AS "userId", query, scope, status, error,
                   category, source_count AS "sourceCount",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [s.id, s.userId, s.query, s.scope || 'public', s.status || 'pending', s.error || null,
         s.category || null, s.sourceCount != null ? s.sourceCount : null]);
    },
    async updateSearch(id, patch) {
      const fields = [];
      const params = [];
      ['status', 'error'].forEach((k) => {
        if (patch[k] === undefined) return;
        params.push(patch[k]);
        fields.push(k + ' = $' + params.length);
      });
      if (!fields.length) return this.getSearch(id);
      params.push(id);
      return one(
        `UPDATE searches SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}
         RETURNING id, user_id AS "userId", query, scope, status, error,
                   category, source_count AS "sourceCount",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        params
      );
    },
    async getSearch(id) {
      return one(`SELECT id, user_id AS "userId", query, scope, status, error,
                         category, source_count AS "sourceCount",
                         created_at AS "createdAt", updated_at AS "updatedAt"
                  FROM searches WHERE id = $1`, [id]);
    },
    async listSearches(userId, { limit, offset }) {
      return q(`SELECT id, user_id AS "userId", query, scope, status, error,
                       category, source_count AS "sourceCount",
                       created_at AS "createdAt", updated_at AS "updatedAt"
                FROM searches WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]);
    },
    async countSearches(userId) {
      const r = await one(`SELECT COUNT(*)::int AS n FROM searches WHERE user_id = $1`, [userId]);
      return r ? r.n : 0;
    },
    async deleteSearch(id) {
      await q(`DELETE FROM searches WHERE id = $1`, [id]);
    },

    async insertResults(rows) {
      for (const r of rows) {
        await q(`INSERT INTO search_results (id, search_id, title, description, url, source, published_at, relevance, score, raw)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
          [r.id, r.searchId, r.title || null, r.description || null, r.url || null, r.source || null,
           r.publishedAt || null, r.relevance != null ? r.relevance : null, r.score != null ? r.score : null,
           r.raw ? JSON.stringify(r.raw) : null]);
      }
    },
    async listResultsBySearch(searchId) {
      return q(`SELECT id, search_id AS "searchId", title, description, url, source,
                       published_at AS "publishedAt", relevance, score, created_at AS "createdAt"
                FROM search_results WHERE search_id = $1 ORDER BY score DESC NULLS LAST`, [searchId]);
    },
    async getAnalysisBySearch(searchId) {
      return one(
        `SELECT id, search_id AS "searchId", user_id AS "userId", headline, summary,
                key_developments AS "keyDevelopments", why_it_matters AS "whyItMatters", confidence,
                sentiment, trending_topics AS "trendingTopics", ai_highlights AS "aiHighlights",
                top_locations AS "topLocations", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM analyses WHERE search_id = $1 ORDER BY created_at DESC LIMIT 1`, [searchId]);
    },

    async createAnalysis(a) {
      return one(
        `INSERT INTO analyses (id, search_id, user_id, headline, summary, key_developments, why_it_matters,
                               confidence, sentiment, trending_topics, ai_highlights, top_locations, raw)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb)
         RETURNING id, search_id AS "searchId", user_id AS "userId", headline, summary,
                   key_developments AS "keyDevelopments", why_it_matters AS "whyItMatters", confidence,
                   sentiment, trending_topics AS "trendingTopics", ai_highlights AS "aiHighlights",
                   top_locations AS "topLocations", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [a.id, a.searchId, a.userId, a.headline || null, a.summary || null,
         JSON.stringify(a.keyDevelopments || []), a.whyItMatters || null,
         a.confidence != null ? a.confidence : null, JSON.stringify(a.sentiment || {}),
         JSON.stringify(a.trendingTopics || []), JSON.stringify(a.aiHighlights || []),
         JSON.stringify(a.topLocations || []), a.raw ? JSON.stringify(a.raw) : null]);
    },
    async listAnalyses(userId, { limit }) {
      return q(`SELECT id, search_id AS "searchId", user_id AS "userId", headline, summary,
                       key_developments AS "keyDevelopments", why_it_matters AS "whyItMatters", confidence,
                       sentiment, trending_topics AS "trendingTopics", ai_highlights AS "aiHighlights",
                       top_locations AS "topLocations", created_at AS "createdAt", updated_at AS "updatedAt"
                FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, limit]);
    },
    async countAnalyses(userId) {
      const r = await one(`SELECT COUNT(*)::int AS n FROM analyses WHERE user_id = $1`, [userId]);
      return r ? r.n : 0;
    },

    async getFb(userId) {
      return one(
        `SELECT id, user_id AS "userId", facebook_user_id AS "facebookUserId", account_id AS "accountId",
                account_name AS "accountName", ig_user_id AS "igUserId",
                page_access_token_enc AS "pageAccessTokenEnc", user_token_enc AS "userTokenEnc",
                status, connected_at AS "connectedAt", last_synced_at AS "lastSyncedAt",
                updated_at AS "updatedAt"
         FROM facebook_connections WHERE user_id = $1`, [userId]);
    },
    async upsertFb(rec) {
      return one(
        `INSERT INTO facebook_connections (user_id, facebook_user_id, account_id, account_name, ig_user_id,
                                           page_access_token_enc, user_token_enc, status, last_synced_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           facebook_user_id = EXCLUDED.facebook_user_id,
           account_id = EXCLUDED.account_id,
           account_name = EXCLUDED.account_name,
           ig_user_id = EXCLUDED.ig_user_id,
           page_access_token_enc = EXCLUDED.page_access_token_enc,
           user_token_enc = EXCLUDED.user_token_enc,
           status = EXCLUDED.status,
           last_synced_at = NOW(),
           updated_at = NOW()
         RETURNING id, user_id AS "userId", facebook_user_id AS "facebookUserId",
                   account_id AS "accountId", account_name AS "accountName", ig_user_id AS "igUserId",
                   status, connected_at AS "connectedAt", last_synced_at AS "lastSyncedAt",
                   updated_at AS "updatedAt"`,
        [rec.userId, rec.facebookUserId || null, rec.accountId || null, rec.accountName || null,
         rec.igUserId || null, rec.pageAccessTokenEnc || null, rec.userTokenEnc || null, rec.status || 'connected']);
    },
    async deleteFb(userId) {
      await q(`DELETE FROM facebook_connections WHERE user_id = $1`, [userId]);
    },

    async createOauthState(s) {
      await q(`INSERT INTO oauth_states (id, user_id, expires_at) VALUES ($1,$2,$3)`, [s.id, s.userId, s.expiresAt]);
      return Object.assign({}, s);
    },
    async getOauthState(id) {
      return one(`SELECT id, user_id AS "userId", used_at AS "usedAt", expires_at AS "expiresAt" FROM oauth_states WHERE id = $1`, [id]);
    },
    async consumeOauthState(id) {
      await q(`UPDATE oauth_states SET used_at = NOW() WHERE id = $1`, [id]);
    },

    async insertActivity(a) {
      await q(`INSERT INTO activity_logs (id, user_id, type, metadata) VALUES ($1,$2,$3,$4::jsonb)`,
        [a.id, a.userId, a.type, JSON.stringify(a.metadata || {})]);
    },
    async listActivity(userId, { limit }) {
      return q(`SELECT id, user_id AS "userId", type, metadata, created_at AS "createdAt"
                FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, limit]);
    },

    async insertNotification(n) {
      return one(`INSERT INTO notifications (id, user_id, type, title, message, read)
                  VALUES ($1,$2,$3,$4,$5,$6)
                  RETURNING id, user_id AS "userId", type, title, message, read, created_at AS "createdAt"`,
        [n.id, n.userId, n.type, n.title, n.message || null, !!n.read]);
    },
    async listNotifications(userId, { limit }) {
      return q(`SELECT id, user_id AS "userId", type, title, message, read, created_at AS "createdAt"
                FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, limit]);
    },
    async countUnreadNotifications(userId) {
      const r = await one(`SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND read = FALSE`, [userId]);
      return r ? r.n : 0;
    },
    async markNotificationRead(id, userId) {
      return one(
        `UPDATE notifications SET read = TRUE
         WHERE id = $1 AND user_id = $2
         RETURNING id, user_id AS "userId", type, title, message, read, created_at AS "createdAt"`,
        [id, userId]);
    },
    async markAllNotificationsRead(userId) {
      await q(`UPDATE notifications SET read = TRUE WHERE user_id = $1`, [userId]);
    },

    async insertDownload(d) {
      return one(`INSERT INTO downloads (id, user_id, search_id, analysis_id, file_type)
                  VALUES ($1,$2,$3,$4,$5)
                  RETURNING id, user_id AS "userId", search_id AS "searchId", analysis_id AS "analysisId",
                            file_type AS "fileType", created_at AS "createdAt"`,
        [d.id, d.userId, d.searchId || null, d.analysisId || null, d.fileType]);
    },
    async listDownloads(userId, { limit }) {
      return q(`SELECT id, user_id AS "userId", search_id AS "searchId", analysis_id AS "analysisId",
                       file_type AS "fileType", created_at AS "createdAt"
                FROM downloads WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, limit]);
    },
    async countDownloads(userId) {
      const r = await one(`SELECT COUNT(*)::int AS n FROM downloads WHERE user_id = $1`, [userId]);
      return r ? r.n : 0;
    },

    async recordLoginAttempt(a) {
      await q(`INSERT INTO login_attempts (id, email, ip, success) VALUES ($1,$2,$3,$4)`,
        [a.id, a.email, a.ip || null, !!a.success]);
    },
    async countRecentFailed(email, ip, since) {
      const r = await one(
        `SELECT COUNT(*)::int AS n FROM login_attempts
         WHERE success = FALSE AND lower(email) = lower($1) AND ($2::text IS NULL OR ip = $2) AND created_at > $3`,
        [email, ip || null, since]);
      return r ? r.n : 0;
    }
  };
}

/* ------------------------------------------------------------------ */
/* factory                                                             */
/* ------------------------------------------------------------------ */
let _pg = null;

function getPool() {
  if (_pg) return _pg;
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  _pg = new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: /sslmode=require/i.test(url) ? { rejectUnauthorized: false } : undefined
  });
  _pg.on('error', (err) => {
    if (typeof console !== 'undefined') console.error('[nabd-db] idle client error', err.message);
  });
  return _pg;
}

let _store = null;
let _schemaReady = null;

/* Lazy, idempotent schema bootstrap — safe to run on every cold start. */
function ensureSchema() {
  if (!_schemaReady) {
    _schemaReady = runMigrations(getPool()).catch((e) => {
      _schemaReady = null;
      throw e;
    });
  }
  return _schemaReady;
}

function makeStore() {
  if (_store) return _store;
  if (process.env.NABD_DATA === 'memory') {
    _store = makeMemoryStore();
    return _store;
  }
  const { runMigrations } = require('../../db/migrate.js');
  const store = makePostgresStore(getPool());
  _store = {
    _ensureSchema: () => runMigrations(getPool()),
    ...store
  };
  return _store;
}

function resetStore() {
  _store = null;
  _pg = null;
}

module.exports = { makeStore, resetStore, getPool, nowIso, randomToken };