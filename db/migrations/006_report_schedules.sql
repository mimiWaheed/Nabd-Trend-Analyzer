-- NABD — one-time report schedules.
-- A user can schedule a saved report; when due_at passes, exactly one
-- reminder email is sent (sent_at marks it done — never repeated).

CREATE TABLE IF NOT EXISTS report_schedules (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query      TEXT NOT NULL,
  report_ref TEXT,
  due_at     TIMESTAMPTZ NOT NULL,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_report_schedules_due ON report_schedules (due_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_user ON report_schedules (user_id);
