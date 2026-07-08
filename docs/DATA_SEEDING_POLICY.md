# Data Seeding Policy — official vs demo data per environment

**Owner directive (2026-07-08):** *"Keep the dummy data/records to local dev & demo
environments only, and maintain the official data with the official records in
staging and production."*

This is a hard data-governance rule for FRMS (an LGU/gov app under the PH Data
Privacy Act, RA 10173). It governs what data each environment may contain.

## The rule

| Environment | Fisherfolk | Vessels / Ayuda / Violations | Notes |
|-------------|-----------|------------------------------|-------|
| **Local dev** | dummy + imported official OK | **dummy/demo OK** | Anything goes — it's a throwaway dev DB. |
| **Demo** (`frms-demo`) | official masterlist (curated) | **dummy/demo OK (curated)** | Client-facing showcase. Curated demo records are intentional and preserved. |
| **Staging** | **official records, ANONYMIZED subset** (PII scrambled) | **official only — NO dummy** | Real structure, no real citizen PII in the less-secure tier (RA 10173). |
| **Production** | **official records (real masterlist)** | **official only — NO dummy** | Real data; real Vessels/Ayuda/Violations come from real user entry / official import. |

**Dummy/demo records** = fabricated content marked `DEMO-MFVR-*` (vessels),
`[DEMO]` (violation subjects), `(Demo)` titles (ayuda), `DEMO-QA-*` (QA fisherfolk).
They belong to **local dev and the demo stack ONLY**.

## How it is enforced

1. **`deploy/scripts/seed-remote.sh`** (staging/prod seeder) imports the official
   fisherfolk masterlist ONLY. It no longer seeds demo Vessels/Ayuda/Violations and
   never invokes `seed-demo.ts`. Staging anonymizes + subsets; production uses the
   real masterlist.
2. **`apps/web/scripts/seed-demo.ts`** (dummy-data injector) hard-refuses to run
   unless `ALLOW_DEMO_SEED=1` is set. `localhost` detection is deliberately NOT used
   as the guard because remote seeding runs over an SSH tunnel that makes a remote DB
   look local. The flag must be passed **explicitly on the command line** for each
   run — it is intentionally NOT in `.env.dev`, because `seed-demo.ts` loads `.env.dev`
   on every invocation (including staging/prod-targeted runs over a tunnel), so a flag
   there would leak in and defeat the guard. Never put `ALLOW_DEMO_SEED` in any env file.
3. **`packages/db/scripts/seed-qa-demo.ts`** (QA fisherfolk) already hard-refuses
   unless the target DB is localhost (dev-only).
4. **`push-to-demo.sh`** promotes an image to the demo stack and runs migrations but
   **NEVER re-seeds** — the demo's curated data is preserved across deploys.

## When seeding each environment

- **Local dev:** `ALLOW_DEMO_SEED=1 pnpm exec tsx scripts/seed-demo.ts` (from `apps/web`).
- **Demo stack:** seed deliberately with `ALLOW_DEMO_SEED=1` against the demo DB (with
  the demo `DATABASE_URL` exported). Do this once when standing up / refreshing the demo;
  `push-to-demo` will not re-seed.
- **Staging / production:** `bash deploy/scripts/seed-remote.sh <stage|prod>` — official
  records only. Do NOT set `ALLOW_DEMO_SEED` in those env files.
