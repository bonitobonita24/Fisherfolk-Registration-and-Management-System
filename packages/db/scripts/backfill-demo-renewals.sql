-- Backfill renewal history for RENEWED fisherfolk that have no RegistrationRenewal rows.
--
-- Why: some demo records carry status = 'RENEWED' (base seed / FIS-12 backfill) but have
-- zero rows in registration_renewals, so the detail page shows "Renewal Date: —" and the
-- derived Renewal Status reads "New registration" — contradicting the RENEWED status.
-- This inserts ONE renewal row per such record so Renewal Date + Renewal Status are coherent.
--
-- Safe + idempotent: NOT EXISTS guard + the unique(fisherfolk_id, renewal_year) constraint.
-- Demo-data curation only — never run against real prod tenant data.
-- Deterministic id/date derived from the fisherfolk id (re-runnable, stable).

INSERT INTO registration_renewals (id, tenant_id, fisherfolk_id, renewal_year, renewed_at, created_at)
SELECT
  'rnwbf_' || substr(md5(f.id), 1, 20),
  f.tenant_id,
  f.id,
  f.registration_year,
  make_timestamp(
    f.registration_year,
    1 + (abs(hashtextextended(f.id, 0)) % 12)::int,
    1 + (abs(hashtextextended(f.id, 1)) % 27)::int,
    9, 0, 0
  ),
  now()
FROM fisherfolk f
WHERE f.status = 'RENEWED'
  AND NOT EXISTS (
    SELECT 1 FROM registration_renewals r WHERE r.fisherfolk_id = f.id
  );
