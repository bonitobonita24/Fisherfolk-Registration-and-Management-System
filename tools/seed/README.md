# Seed pipeline — staging & production

Seeds a deployed FRMS environment with the **official fisherfolk masterlist**
plus **demo data** for the other modules (Vessels, Ayuda, Violations).

## Source of truth

The 3,002 official fisherfolk records are the real masterlist, kept in the
sibling project:

```
../fmo-fisherfolk-reporting-tool/data/fisherfolk.sqlite
```

This SQLite file is the **single source of truth**. The pipeline regenerates the
import JSON from it at deploy time, so **no real PII is ever committed** to this
repo. Generated files land in `.seed-cache/` (gitignored).

## One command

```bash
# Production — real official records + demo data (asks for confirmation)
bash deploy/scripts/seed-remote.sh prod

# Staging — anonymized 300-record subset + demo data (safe, no real PII/photos)
bash deploy/scripts/seed-remote.sh stage
```

Requires `python3`, `pnpm`, and the target env file (`.env.prod` / `.env.staging`)
at repo root with a `DATABASE_URL` pointing at the remote DB.

### Options

| Flag | Default | Meaning |
|------|---------|---------|
| `--limit <n>` | 300 | staging subset size (ignored for prod) |
| `--vessels <n>` | 80 | demo vessels |
| `--beneficiaries <n>` | 40 | demo ayuda beneficiaries per program |
| `--violations <n>` | 12 | demo violations |
| `--no-demo` | — | fisherfolk only, skip demo modules |
| `--db <path>` | sibling FMO project | path to `fisherfolk.sqlite` |
| `--yes` | — | skip the production confirmation prompt |

## What each environment gets

| | Production | Staging |
|---|---|---|
| Fisherfolk | **Real** 3,002 official records | **Anonymized** subset (default 300) |
| Names / contacts / RSBSA | real | scrambled / blanked |
| Date of birth | real | year kept, month/day randomized |
| Photos / signatures | not loaded here¹ | none |
| Barangay / categories | real | real (geographic, non-personal) |
| Vessels / Ayuda / Violations | demo (clearly marked) | demo (clearly marked) |

¹ Photos/signatures are **text-data-excluded by design** (PII + size). Loading
them to a remote MinIO/S3 is a separate, optional step — see "Assets" below.

## Pieces

| File | Role |
|------|------|
| `tools/seed/export-fmo.py` | SQLite masterlist → import JSON (FmoRow shape) |
| `tools/seed/anonymize-fmo.py` | export JSON → anonymized staging subset |
| `apps/web/scripts/import-fmo.ts` | imports the JSON into a tenant (idempotent — skips existing `idNumber`s) |
| `apps/web/scripts/seed-demo.ts` | demo Vessels/Ayuda/Violations (idempotent; rows marked `DEMO-MFVR-*`, `[DEMO]`, `(Demo)`) |
| `deploy/scripts/seed-remote.sh` | orchestrates the right path per env |

## Notes

- **Idempotent.** Re-running skips existing fisherfolk and upserts demo data —
  no duplicates.
- **HARD HOLD.** `seed-remote.sh` is owner-run only; it is never auto-invoked by
  CI or the deploy pipeline. Production requires typing `yes`.
- **Demo data is identifiable** and can be purged later: vessels `DEMO-MFVR-*`,
  violations `subject LIKE '[DEMO]%'`, ayuda programs `title LIKE '%(Demo)'`.
- **Data Privacy (RA 10173).** Staging never receives real PII; that is why the
  staging path anonymizes. Production seeding writes real records and must only
  be run against the authorized production database.

### Assets (photos/signatures) — optional, production only

`import-fmo.ts` supports `--with-assets --assets <dir>` to link real
photos/signatures into MinIO/S3. To ship them to a remote environment you would
run the importer with the asset directory available and the remote `STORAGE_*`
env exported. Not wired into `seed-remote.sh` by default (kept fast + small).
