-- NABD — initial schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone         TEXT,
  organization  TEXT,
  country       TEXT,
  lang          TEXT NOT NULL DEFAULT 'en',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  token_hash    TEXT NOT NULL UNIQUE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip            TEXT,
  user_agent    TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS email_verifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash      TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  max_attempts  INTEGER NOT NULL DEFAULT 5,
  used_at       TIMESTAMPTZ,
  resend_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data          JSONB NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS searches (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query         TEXT NOT NULL,
  scope         TEXT NOT NULL DEFAULT 'public',
  status        TEXT NOT NULL DEFAULT 'pending',
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_searches_user_created ON searches (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS search_results (
  id            TEXT PRIMARY KEY,
  search_id     TEXT NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  title         TEXT,
  description   TEXT,
  url           TEXT,
  source        TEXT,
  published_at  TIMESTAMPTZ,
  relevance     NUMERIC,
  score         NUMERIC,
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_results_search ON search_results (search_id);

CREATE TABLE IF NOT EXISTS analyses (
  id               TEXT PRIMARY KEY,
  search_id        TEXT NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline         TEXT,
  summary          TEXT,
  key_developments JSONB,
  why_it_matters   TEXT,
  confidence       NUMERIC,
  sentiment        JSONB,
  trending_topics  JSONB,
  ai_highlights    JSONB,
  top_locations    JSONB,
  raw              JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_search ON analyses (search_id);

CREATE TABLE IF NOT EXISTS facebook_connections (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  facebook_user_id     TEXT,
  account_id           TEXT,
  account_name         TEXT,
  ig_user_id           TEXT,
  page_access_token_enc TEXT,
  user_token_enc       TEXT,
  status               TEXT NOT NULL DEFAULT 'connected',
  connected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at       TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_states (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user ON oauth_states (user_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_logs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT,
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS downloads (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_id     TEXT REFERENCES searches(id) ON DELETE SET NULL,
  analysis_id   TEXT REFERENCES analyses(id) ON DELETE SET NULL,
  file_type     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_downloads_user_created ON downloads (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  ip            TEXT,
  success       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts (email, created_at DESC);
