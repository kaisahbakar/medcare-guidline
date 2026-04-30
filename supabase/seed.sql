-- =============================================================
-- MedCare Guideline System — Seed Data
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)
-- =============================================================

-- ---------------------------------------------------------------
-- 1. user_guide_type
-- ---------------------------------------------------------------
INSERT INTO user_guide_type (id, name, created_at) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Patient Guide',  now()),
  ('11111111-0000-0000-0000-000000000002', 'Doctor Guide',   now()),
  ('11111111-0000-0000-0000-000000000003', 'Nurse Guide',    now());

-- ---------------------------------------------------------------
-- 2. category  (2 per guide type = 6 total)
-- ---------------------------------------------------------------
INSERT INTO category (id, user_guide_type_id, name, created_at) VALUES
  -- Patient Guide
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Getting Started',   now()),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Appointments',      now()),
  -- Doctor Guide
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Clinical Workflows', now()),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Prescriptions',     now()),
  -- Nurse Guide
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'Patient Care',      now()),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003', 'Medication Admin',  now());

-- ---------------------------------------------------------------
-- 3. manual  (2 published manuals)
-- ---------------------------------------------------------------
INSERT INTO manual (id, category_id, title, status, created_at, updated_at) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',   -- Patient Guide / Getting Started
    'Welcome to MedCare Patient Portal',
    'published',
    now(), now()
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000004',   -- Doctor Guide / Prescriptions
    'Prescribing Guidelines & Safety Checks',
    'published',
    now(), now()
  );

-- ---------------------------------------------------------------
-- 4. layout_row  (manual 1: 3 rows with column_counts 1, 2, 1)
-- ---------------------------------------------------------------
INSERT INTO layout_row (id, manual_id, display_order, column_count, created_at) VALUES
  -- Manual 1 rows
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 1, 1, now()),
  ('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 2, 2, now()),
  ('44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000001', 3, 1, now()),
  -- Manual 2 rows (2 rows, column_counts 1, 2)
  ('44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000002', 1, 1, now()),
  ('44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', 2, 2, now());

-- ---------------------------------------------------------------
-- 5. manual_block
--    Manual 1 — "Welcome to MedCare Patient Portal"
--    Row 1 (col_count=1): heading_1
--    Row 2 (col_count=2): paragraph | bulleted_list + callout
--    Row 3 (col_count=1): divider
--
--    Manual 2 — "Prescribing Guidelines & Safety Checks"
--    Row 4 (col_count=1): heading_1
--    Row 5 (col_count=2): heading_2 + paragraph | callout
-- ---------------------------------------------------------------
INSERT INTO manual_block (id, layout_row_id, column_index, display_order, block_type, content_json, created_at) VALUES

  -- ---- Manual 1 / Row 1 / 1-col ----
  (
    '55555555-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000001',
    0, 1,
    'heading_1',
    '{"text": "Welcome to the MedCare Patient Portal"}',
    now()
  ),

  -- ---- Manual 1 / Row 2 / 2-col ----
  -- column 0: paragraph
  (
    '55555555-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000002',
    0, 1,
    'paragraph',
    '{"text": "The MedCare Patient Portal gives you secure, 24/7 access to your health records, upcoming appointments, and care team messages. Use this guide to get set up quickly."}',
    now()
  ),
  -- column 1: bulleted_list
  (
    '55555555-0000-0000-0000-000000000003',
    '44444444-0000-0000-0000-000000000002',
    1, 1,
    'bulleted_list',
    '{"text": "View and download your medical records\nRequest prescription refills\nMessage your care team\nSchedule or reschedule appointments\nPay your bills securely online"}',
    now()
  ),
  -- column 1: callout (after the list)
  (
    '55555555-0000-0000-0000-000000000004',
    '44444444-0000-0000-0000-000000000002',
    1, 2,
    'callout',
    '{"text": "Need help? Call our Patient Support line at 1-800-MED-CARE (Mon–Fri, 8 am–6 pm)."}',
    now()
  ),

  -- ---- Manual 1 / Row 3 / 1-col ----
  (
    '55555555-0000-0000-0000-000000000005',
    '44444444-0000-0000-0000-000000000003',
    0, 1,
    'divider',
    '{}',
    now()
  ),
  -- heading_2 after divider in same row
  (
    '55555555-0000-0000-0000-000000000006',
    '44444444-0000-0000-0000-000000000003',
    0, 2,
    'heading_2',
    '{"text": "Next Steps"}',
    now()
  ),
  (
    '55555555-0000-0000-0000-000000000007',
    '44444444-0000-0000-0000-000000000003',
    0, 3,
    'paragraph',
    '{"text": "Complete your profile, verify your identity, and link any dependent accounts to get the most out of MedCare."}',
    now()
  ),

  -- ---- Manual 2 / Row 4 / 1-col ----
  (
    '55555555-0000-0000-0000-000000000008',
    '44444444-0000-0000-0000-000000000004',
    0, 1,
    'heading_1',
    '{"text": "Prescribing Guidelines & Safety Checks"}',
    now()
  ),
  (
    '55555555-0000-0000-0000-000000000009',
    '44444444-0000-0000-0000-000000000004',
    0, 2,
    'paragraph',
    '{"text": "This guide outlines the standard prescribing workflows within MedCare, including mandatory safety checks, drug interaction alerts, and controlled substance protocols."}',
    now()
  ),

  -- ---- Manual 2 / Row 5 / 2-col ----
  -- column 0: heading_2 + paragraph
  (
    '55555555-0000-0000-0000-000000000010',
    '44444444-0000-0000-0000-000000000005',
    0, 1,
    'heading_2',
    '{"text": "Drug Interaction Checks"}',
    now()
  ),
  (
    '55555555-0000-0000-0000-000000000011',
    '44444444-0000-0000-0000-000000000005',
    0, 2,
    'paragraph',
    '{"text": "MedCare automatically screens for Class A–C drug interactions at the point of prescribing. Physicians must acknowledge any flagged interaction before an order can be submitted."}',
    now()
  ),
  -- column 1: callout
  (
    '55555555-0000-0000-0000-000000000012',
    '44444444-0000-0000-0000-000000000005',
    1, 1,
    'callout',
    '{"text": "For controlled substances (Schedule II–V), a DEA number and state license verification are required before prescribing. Contact Pharmacy Services for exceptions."}',
    now()
  );

-- ---------------------------------------------------------------
-- 6. manual_version  (one initial version per manual)
-- ---------------------------------------------------------------
INSERT INTO manual_version (id, manual_id, version_number, created_at) VALUES
  ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 1, now()),
  ('66666666-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 1, now());
