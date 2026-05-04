-- =============================================================
-- layout_row — add column_width_fr (optional but recommended)
-- =============================================================
-- Your base table (int PKs, timestamps) is expected to look like:
--   id            int4 PK
--   manual_id     int4
--   column_count  int4
--   display_order int4
--   created_at    timestamp
--   updated_at    timestamp
--
-- Run once in the Supabase SQL editor (or your migration runner).

alter table layout_row
  add column if not exists column_width_fr jsonb default null;

comment on column layout_row.column_width_fr is
  'JSON array of positive numbers, length = column_count, proportional fr units (e.g. [2,1]). Null = equal columns.';
