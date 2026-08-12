-- NABD — search metadata for the history / saved-searches pages.
-- Category + source count let the dashboard persist richer history rows
-- server-side (matching what the client used to keep in localStorage).

ALTER TABLE searches
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS source_count INTEGER;
