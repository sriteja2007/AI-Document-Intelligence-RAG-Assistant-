"""Supabase Database and Storage Verification Script.

Checks:
  1. The four core tables (documents, chunks, conversations, messages) exist and can be queried.
  2. The storage bucket 'documents' exists.
  3. The vector search function 'match_chunks' exists and responds.

Usage:
  backend/.venv/Scripts/python backend/scripts/check_db.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict, List

# Ensure backend root is on sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from dotenv import load_dotenv
    # Load backend/.env
    env_path = BACKEND_DIR / ".env"
    load_dotenv(dotenv_path=env_path)
except Exception:
    pass

from supabase import Client, create_client


def get_masked_url(url: str) -> str:
    """Return a masked version of the Supabase URL for safe logging."""
    if not url:
        return "[NOT SET]"
    if len(url) > 20:
        return url[:12] + "..." + url[-10:]
    return url


def run_checks() -> int:
    """Run all Supabase verification checks and print PASS/FAIL status."""
    print("=" * 65)
    print("AI Document Intelligence - Supabase Database & Storage Verification")
    print("=" * 65)

    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not supabase_url:
        print("\n[FAIL] Missing SUPABASE_URL in backend/.env")
        print("-> Action: Open backend/.env and paste your Supabase Project URL.")
        return 1

    if not supabase_key:
        print("\n[FAIL] Missing SUPABASE_SERVICE_ROLE_KEY in backend/.env")
        print("-> Action: Open backend/.env and paste your Supabase service_role key.")
        return 1

    print(f"Supabase URL       : {get_masked_url(supabase_url)}")
    print("Service Role Key   : [PRESENT - SECRET KEPT HIDDEN]")
    print("-" * 65)

    try:
        client: Client = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"\n[FAIL] Could not connect to Supabase: {e}")
        print("-> Action: Double check that your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct.")
        return 1

    passed_count = 0
    total_checks = 6
    failures: List[Dict[str, str]] = []

    # --------------------------------------------------------------------------
    # Check 1: Tables (documents, chunks, conversations, messages)
    # --------------------------------------------------------------------------
    tables = ["documents", "chunks", "conversations", "messages"]
    print("\n[1] Checking Database Tables:")

    for table in tables:
        try:
            # Query 1 row using service role key (which bypasses RLS)
            response = client.table(table).select("*").limit(1).execute()
            print(f"  [PASS] Table '{table}' exists and is queryable.")
            passed_count += 1
        except Exception as e:
            err_str = str(e)
            print(f"  [FAIL] Table '{table}' could not be queried.")
            failures.append({
                "component": f"Table '{table}'",
                "reason": f"Table check failed: {err_str}",
                "fix": "Run the SQL script located at supabase/schema.sql in the Supabase SQL Editor to create this table.",
            })

    # --------------------------------------------------------------------------
    # Check 2: Storage Bucket ('documents')
    # --------------------------------------------------------------------------
    print("\n[2] Checking Storage Bucket:")
    try:
        buckets = client.storage.list_buckets()
        bucket_names = []
        for b in buckets:
            if hasattr(b, "name") and b.name:
                bucket_names.append(b.name)
            elif hasattr(b, "id") and b.id:
                bucket_names.append(b.id)
            elif isinstance(b, dict):
                bucket_names.append(b.get("name") or b.get("id"))

        if "documents" in bucket_names:
            print("  [PASS] Storage bucket 'documents' exists.")
            passed_count += 1
        else:
            print(f"  [FAIL] Storage bucket 'documents' not found. Existing buckets: {bucket_names or 'None'}")
            failures.append({
                "component": "Storage Bucket 'documents'",
                "reason": "The 'documents' storage bucket does not exist in your Supabase project.",
                "fix": (
                    "In the Supabase dashboard:\n"
                    "    1. Click 'Storage' on the left menu.\n"
                    "    2. Click 'New bucket'.\n"
                    "    3. Name it 'documents' (all lowercase).\n"
                    "    4. Leave 'Public bucket' OFF (Private).\n"
                    "    5. Click 'Save bucket'."
                ),
            })
    except Exception as e:
        err_str = str(e)
        print(f"  [FAIL] Storage bucket check encountered an error.")
        failures.append({
            "component": "Storage Bucket 'documents'",
            "reason": f"Error accessing storage API: {err_str}",
            "fix": "Check your Supabase Storage settings and ensure your service role key is valid.",
        })

    # --------------------------------------------------------------------------
    # Check 3: Vector Search Function ('match_chunks')
    # --------------------------------------------------------------------------
    print("\n[3] Checking match_chunks RPC Function:")
    try:
        # Test call with zero-vector and dummy uuid
        dummy_vector = [0.0] * 768
        rpc_params = {
            "query_embedding": dummy_vector,
            "match_count": 1,
            "p_user_id": "00000000-0000-0000-0000-000000000000",
        }
        res = client.rpc("match_chunks", rpc_params).execute()
        print("  [PASS] Function 'match_chunks' exists and responds correctly.")
        passed_count += 1
    except Exception as e:
        err_str = str(e)
        print("  [FAIL] Function 'match_chunks' not found or failed to execute.")
        failures.append({
            "component": "Function 'match_chunks'",
            "reason": f"RPC call failed: {err_str}",
            "fix": (
                "Ensure step 1 and step 8 of supabase/schema.sql were executed:\n"
                "    1. Run: create extension if not exists vector;\n"
                "    2. Run the CREATE OR REPLACE FUNCTION match_chunks block from supabase/schema.sql in the Supabase SQL Editor."
            ),
        })

    # --------------------------------------------------------------------------
    # Summary & Action Items
    # --------------------------------------------------------------------------
    print("\n" + "=" * 65)
    print(f"SUMMARY: {passed_count}/{total_checks} checks passed.")
    print("=" * 65)

    if failures:
        print("\nACTION REQUIRED IN SUPABASE:")
        for idx, fail in enumerate(failures, 1):
            print(f"\n{idx}. {fail['component']}:")
            print(f"   Why it failed : {fail['reason']}")
            print(f"   How to fix    : {fail['fix']}")
        print("\nReview supabase/SETUP.md for detailed click-by-click instructions.")
        return 1

    print("\nALL CHECKS PASSED! Your Supabase database and storage are fully configured.")
    return 0


if __name__ == "__main__":
    sys.exit(run_checks())
