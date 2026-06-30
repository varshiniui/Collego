"""
Seed script: loads colleges_seed.csv into your Supabase `colleges` table.

Usage:
    1. Place this file in backend/ (same folder as app.py), alongside
       colleges_seed.csv.
    2. Make sure your .env (or environment) has SUPABASE_URL and
       SUPABASE_KEY set — same values your Flask backend does.
    3. Run:  python seed_colleges.py

What it does:
    - Reads colleges_seed.csv
    - UPSERTS by college name: if a college with the same name already
      exists, its row is UPDATED with the new data; otherwise it's
      inserted fresh. Safe to re-run any time after editing the CSV.
"""

import os
import csv
import sys

try:
    from supabase import create_client
except ImportError:
    print("Missing dependency. Run: pip install supabase --break-system-packages")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and/or SUPABASE_KEY not found in environment.")
    print("Set them the same way your Flask backend does (.env file or shell export).")
    sys.exit(1)

CSV_PATH = os.path.join(os.path.dirname(__file__), "colleges_seed.csv")

FLOAT_FIELDS = ["min_cutoff_percentage", "fees_min", "fees_max"]
INT_FIELDS = ["ranking", "typical_rank_cutoff"]


def load_rows():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    for row in rows:
        for field in FLOAT_FIELDS:
            val = row.get(field, "").strip()
            row[field] = float(val) if val else None
        for field in INT_FIELDS:
            val = row.get(field, "").strip()
            row[field] = int(float(val)) if val else None
        row["is_active"] = True
    return rows


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    rows = load_rows()
    print(f"Loaded {len(rows)} colleges from {CSV_PATH}")

    # Upsert requires "name" to be UNIQUE in the colleges table for
    # on_conflict to work. If it's not unique yet, this prints a clear
    # error rather than silently failing.
    batch_size = 20
    upserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        try:
            result = supabase.table("colleges").upsert(
                batch, on_conflict="name"
            ).execute()
            upserted += len(result.data or [])
            print(f"Upserted batch {i // batch_size + 1}: {len(batch)} colleges")
        except Exception as e:
            print(f"ERROR on batch {i // batch_size + 1}: {e}")
            print("If this mentions a missing unique constraint on 'name', "
                  "run this in Supabase SQL editor first:")
            print('  ALTER TABLE colleges ADD CONSTRAINT colleges_name_key UNIQUE (name);')
            sys.exit(1)

    print(f"\nDone. Upserted {upserted} colleges (existing rows updated, new rows inserted).")


if __name__ == "__main__":
    main()