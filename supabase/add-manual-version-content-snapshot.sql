-- Add content_snapshot column to manual_version, and reset the serial sequence
-- so it starts above any rows inserted by seed data.
-- Run in the Supabase SQL editor (Dashboard → SQL editor → New query)

ALTER TABLE manual_version
  ADD COLUMN IF NOT EXISTS content_snapshot jsonb;

-- The seed inserted rows with explicit numeric IDs, which bypasses the serial
-- sequence and leaves it out of sync. Reset it to the current max + 1.
SELECT setval(
  pg_get_serial_sequence('manual_version', 'id'),
  COALESCE((SELECT MAX(id) FROM manual_version), 0) + 1,
  false
);
