-- NABD — add user-editable role/position field to profiles

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
