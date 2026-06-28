#!/usr/bin/env python3
"""
export-fmo.py — Export the canonical FMO fisherfolk masterlist (SQLite) to the
JSON array shape consumed by apps/web/scripts/import-fmo.ts.

The official 3,002-record masterlist in fmo-fisherfolk-reporting-tool/data/
fisherfolk.sqlite is the SINGLE SOURCE OF TRUTH for real fisherfolk records.
This script regenerates the import JSON at deploy time so no real PII is ever
committed to the repo.

Usage:
  python3 tools/seed/export-fmo.py \
    [--db <path-to-fisherfolk.sqlite>]   (default: ../fmo-fisherfolk-reporting-tool/data/fisherfolk.sqlite)
    [--out <path.json>]                  (default: ./.seed-cache/fmo-export.json)

Output: JSON array of FmoRow objects (id_number, full_name, date_of_birth,
address, sex, image, signature, rsbsa, contact_number, and the six category
flag columns). date_registered / date_updated are intentionally omitted — the
importer derives its own timestamps.
"""

import argparse
import json
import os
import sqlite3
import sys

# Columns the importer (FmoRow) consumes, in declaration order.
FMO_FIELDS = [
    "id_number",
    "full_name",
    "date_of_birth",
    "address",
    "sex",
    "image",
    "signature",
    "rsbsa",
    "contact_number",
    "boat_owneroperator",
    "capture_fishing",
    "gleaning",
    "vendor",
    "fish_processing",
    "aquaculture",
]

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB = os.path.normpath(
    os.path.join(REPO_ROOT, "..", "fmo-fisherfolk-reporting-tool", "data", "fisherfolk.sqlite")
)
DEFAULT_OUT = os.path.join(REPO_ROOT, ".seed-cache", "fmo-export.json")


def main() -> int:
    ap = argparse.ArgumentParser(description="Export FMO masterlist SQLite -> import JSON")
    ap.add_argument("--db", default=os.environ.get("FMO_SQLITE", DEFAULT_DB))
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()

    if not os.path.isfile(args.db):
        print(f"❌  SQLite source not found: {args.db}", file=sys.stderr)
        print("    Pass --db <path> or set FMO_SQLITE.", file=sys.stderr)
        return 1

    conn = sqlite3.connect(f"file:{args.db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Only read the columns the importer needs; tolerate column absence.
    available = {r[1] for r in cur.execute("PRAGMA table_info(fisherfolk)")}
    select_cols = [c for c in FMO_FIELDS if c in available]
    rows = cur.execute(f"SELECT {', '.join(select_cols)} FROM fisherfolk").fetchall()

    out_rows = []
    for r in rows:
        # Coerce every value to a string; the importer treats fields as strings.
        rec = {}
        for c in FMO_FIELDS:
            v = r[c] if c in r.keys() else None
            rec[c] = "" if v is None else str(v)
        out_rows.append(rec)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_rows, f, ensure_ascii=False, indent=0)

    conn.close()
    print(f"✅  Exported {len(out_rows)} fisherfolk records -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
