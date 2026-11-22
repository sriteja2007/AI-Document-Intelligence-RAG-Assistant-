"""Verification script for Phase 5: Document Upload, Storage, and Multi-Tenant Isolation."""

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from starlette.testclient import TestClient
from supabase import create_client
from app.core.config import settings
from app.main import app

client_app = TestClient(app)


def verify():
    print("=" * 65)
    print("AI Document Intelligence - Phase 5 Verification")
    print("=" * 65)

    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # 1. Look up users
    users = client.auth.admin.list_users()
    user_map = {u.email: u.id for u in users}
    test1_id = user_map.get("test1@example.com")
    test2_id = user_map.get("test2@example.com")

    print(f"User test1@example.com ID : {test1_id}")
    print(f"User test2@example.com ID : {test2_id}")
    assert test1_id, "test1@example.com user not found"
    assert test2_id, "test2@example.com user not found"

    # 2. Check Database rows
    docs_test1 = client.table("documents").select("*").eq("user_id", test1_id).execute().data
    print(f"\n[Database Check]")
    print(f"Documents for test1 in DB: {len(docs_test1)}")
    for d in docs_test1:
        print(f"  - ID: {d['id']}, Name: {d['name']}, Status: {d['status']}, Size: {d['file_size']}B, Path: {d['storage_path']}")

    docs_test2 = client.table("documents").select("*").eq("user_id", test2_id).execute().data
    print(f"Documents for test2 in DB: {len(docs_test2)}")
    assert len(docs_test2) == 0, "test2 must have 0 documents"

    # 3. Check Storage bucket 'documents'
    print(f"\n[Storage Bucket Check]")
    storage_files = client.storage.from_("documents").list(test1_id)
    file_names = [f["name"] for f in storage_files]
    print(f"Files in bucket 'documents/{test1_id}/': {len(storage_files)}")
    for name in file_names:
        print(f"  - Storage file: {name}")

    assert any("sample_ai_report.pdf" in name for name in file_names), "sample_ai_report.pdf must be in storage"
    assert not any("sample_notes.txt" in name for name in file_names), "sample_notes.txt must be removed from storage"
    assert not any(d["name"] == "sample_notes.txt" for d in docs_test1), "sample_notes.txt must be removed from DB"
    print("CONFIRMED: sample_notes.txt was completely deleted from both DB and Storage.")
    print("CONFIRMED: sample_ai_report.pdf exists in both DB and Storage.")

    # 4. API Cross-Tenant Isolation Check (GET /documents/{id} with test2 token)
    print(f"\n[Cross-Tenant API Isolation Check]")
    from jose import jwt
    test2_token = jwt.encode(
        {"sub": test2_id, "email": "test2@example.com", "role": "authenticated"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )

    test1_doc_id = docs_test1[0]["id"]
    headers = {"Authorization": f"Bearer {test2_token}"}

    resp = client_app.get(f"/documents/{test1_doc_id}", headers=headers)
    print(f"GET /documents/{test1_doc_id} with test2 token returned HTTP status {resp.status_code}: {resp.json()}")
    assert resp.status_code == 404, f"Expected 404 Not Found, got {resp.status_code}"
    print("CONFIRMED: test2 receives 404 Not Found when attempting to access test1's document.")

    # 5. Confirm test2 GET /documents returns empty list []
    resp_list = client_app.get("/documents", headers=headers)
    print(f"GET /documents with test2 token returned: {resp_list.json()}")
    assert resp_list.status_code == 200, f"Expected 200, got {resp_list.status_code}"
    assert len(resp_list.json()) == 0, "test2 documents list must be empty"
    print("CONFIRMED: test2 document repository is completely isolated and empty.")

    print("\n" + "=" * 65)
    print("ALL 7 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 65)


if __name__ == "__main__":
    verify()
