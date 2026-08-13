-- NABD — auth flows storage.
-- Additive, idempotent migration (safe for existing Neon data; does not touch
-- 001/002). Enables:
--   1. pending_signups — registration data kept BEFORE email verification so a
--      real `users` row is only created once the OTP is confirmed.
--   2. password_resets — reset OTPs for existing verified accounts, kept
--      separate from signup verification records to avoid ambiguity.
--   3. login_otps — one-time-code logins for existing verified accounts, kept
--      separate from signup/reset records.
-- All OTPs are stored hashed (SHA-256), expire, are single-use, and respect
-- the same max-attempt + resend-cooldown limits used by email_verifications.

CREATE TABLE IF NOT EXISTS pending_signups (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone         TEXT,
  organization  TEXT,
  country       TEXT,
  lang          TEXT NOT NULL DEFAULT 'en',
  otp_hash      TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  max_attempts  INTEGER NOT NULL DEFAULT 5,
  used_at       TIMESTAMPTZ,
  resend_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups (lower(email));
CREATE INDEX IF NOT EXISTS idx_pending_signups_expiry ON pending_signups (expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
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
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS login_otps (
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
CREATE INDEX IF NOT EXISTS idx_login_otps_user ON login_otps (user_id, created_at DESC);
