#!/usr/bin/env python3
"""
anonymize-fmo.py — Produce an ANONYMIZED, SUBSET copy of the FMO export for
STAGING. Staging is a less-secured environment, so under the PH Data Privacy
Act (RA 10173) it must NOT hold real fisherfolk PII.

What is scrambled (personal data):
  - full_name        -> randomly generated Filipino-style name
  - contact_number   -> random 09XXXXXXXXX
  - rsbsa            -> blanked
  - date_of_birth    -> YEAR preserved (keeps age-group charts realistic),
                        month/day randomized (breaks exact identification)
  - id_number        -> reassigned to FF-2026-NNNN sequential (breaks linkage
                        to the real masterlist IDs)
  - image / signature -> blanked (no real photos on staging)

What is preserved (non-personal, keeps demos realistic):
  - address / barangay (geographic) and the six category flags, so the
    barangay + category distributions on dashboards still look real.

Deterministic: a fixed RNG seed makes the same input yield the same staging
set every run.

Usage:
  python3 tools/seed/anonymize-fmo.py \
    [--in <fmo-export.json>]     (default: ./.seed-cache/fmo-export.json)
    [--out <fmo-staging.json>]   (default: ./.seed-cache/fmo-staging.json)
    [--limit <n>]                (subset size, default: 300)
    [--seed <n>]                 (RNG seed, default: 1337)
"""

import argparse
import json
import os
import random
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_IN = os.path.join(REPO_ROOT, ".seed-cache", "fmo-export.json")
DEFAULT_OUT = os.path.join(REPO_ROOT, ".seed-cache", "fmo-staging.json")

FIRST_NAMES = [
    "Juan", "Maria", "Jose", "Rosa", "Pedro", "Ana", "Antonio", "Luz",
    "Ricardo", "Carmen", "Eduardo", "Teresita", "Manuel", "Gloria", "Roberto",
    "Lourdes", "Ramon", "Cristina", "Felipe", "Dolores", "Andres", "Remedios",
    "Bayani", "Corazon", "Dante", "Imelda", "Efren", "Nenita", "Rogelio", "Perla",
]
MIDDLE_NAMES = [
    "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza",
    "Torres", "Flores", "Villanueva", "Ramos", "Aquino", "Castillo", "Domingo",
]
LAST_NAMES = [
    "Dela Cruz", "Garcia", "Reyes", "Ramos", "Mercado", "Aguilar", "Fernandez",
    "Salvador", "Pascual", "Navarro", "Marquez", "Espiritu", "Magsaysay",
    "Bonifacio", "Tolentino", "Gatchalian", "Lacson", "Panganiban", "Rosales",
]


def fake_name(rng: random.Random) -> str:
    return f"{rng.choice(FIRST_NAMES)} {rng.choice(MIDDLE_NAMES)} {rng.choice(LAST_NAMES)}"


def fake_contact(rng: random.Random) -> str:
    return "09" + "".join(str(rng.randint(0, 9)) for _ in range(9))


def scramble_dob(dob: str, rng: random.Random) -> str:
    # Keep the year (age-group charts), randomize month/day.
    if not dob or len(dob) < 4 or not dob[:4].isdigit():
        return ""
    year = dob[:4]
    return f"{year}-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d}"


def main() -> int:
    ap = argparse.ArgumentParser(description="Anonymize + subset FMO export for staging")
    ap.add_argument("--in", dest="inp", default=DEFAULT_IN)
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--limit", type=int, default=300)
    ap.add_argument("--seed", type=int, default=1337)
    args = ap.parse_args()

    if not os.path.isfile(args.inp):
        print(f"❌  Input export not found: {args.inp}", file=sys.stderr)
        print("    Run export-fmo.py first.", file=sys.stderr)
        return 1

    with open(args.inp, encoding="utf-8") as f:
        rows = json.load(f)

    rng = random.Random(args.seed)
    # Stable subset: shuffle a copy of indices, take the first N — preserves the
    # natural barangay/category spread instead of just the top of the file.
    rng.shuffle(rows)
    subset = rows[: args.limit]

    out_rows = []
    for i, r in enumerate(subset, start=1):
        rec = dict(r)
        rec["full_name"] = fake_name(rng)
        rec["contact_number"] = fake_contact(rng)
        rec["rsbsa"] = ""
        rec["date_of_birth"] = scramble_dob(r.get("date_of_birth", ""), rng)
        rec["id_number"] = f"FF-2026-{i:04d}"
        rec["image"] = ""
        rec["signature"] = ""
        # address + category flags retained as-is.
        out_rows.append(rec)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_rows, f, ensure_ascii=False, indent=0)

    print(f"✅  Anonymized {len(out_rows)} staging records -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
