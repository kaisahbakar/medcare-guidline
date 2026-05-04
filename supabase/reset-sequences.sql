-- Reset serial sequences for all tables whose seed data used explicit IDs.
-- The sequences were never advanced, so the next auto-assigned ID collides
-- with an existing seed row.
-- Run in the Supabase SQL editor (Dashboard → SQL editor → New query).

SELECT setval(pg_get_serial_sequence('user_guide_type', 'id'),
              COALESCE((SELECT MAX(id) FROM user_guide_type), 0) + 1, false);

SELECT setval(pg_get_serial_sequence('category', 'id'),
              COALESCE((SELECT MAX(id) FROM category), 0) + 1, false);

SELECT setval(pg_get_serial_sequence('manual', 'id'),
              COALESCE((SELECT MAX(id) FROM manual), 0) + 1, false);

SELECT setval(pg_get_serial_sequence('layout_row', 'id'),
              COALESCE((SELECT MAX(id) FROM layout_row), 0) + 1, false);

SELECT setval(pg_get_serial_sequence('manual_block', 'id'),
              COALESCE((SELECT MAX(id) FROM manual_block), 0) + 1, false);

SELECT setval(pg_get_serial_sequence('manual_version', 'id'),
              COALESCE((SELECT MAX(id) FROM manual_version), 0) + 1, false);
