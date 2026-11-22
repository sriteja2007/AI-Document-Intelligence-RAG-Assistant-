"""Debug script to test similarity search against document chunks.

Given a document ID and a question from the command line, embeds the question
and queries the PostgreSQL match_chunks function via Supabase RPC, printing the
top 3 most similar chunks with their page numbers and similarity scores.
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.supabase import get_supabase_client
from app.services.embeddings import embed_query


def main() -> None:
    """Run similarity search test against a document."""
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/test_similarity.py <document_id> [question]")
        sys.exit(1)

    document_id = sys.argv[1].strip()

    if len(sys.argv) >= 3:
        question = " ".join(sys.argv[2:]).strip()
    else:
        try:
            question = input("Enter your search question: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    if not question:
        print("Error: Question cannot be empty.")
        sys.exit(1)

    print(f"\n[1/3] Looking up document '{document_id}'...")
    supabase = get_supabase_client()

    try:
        doc_res = (
            supabase.table("documents")
            .select("id, name, status, user_id, page_count")
            .eq("id", document_id)
            .execute()
        )
    except Exception as exc:
        print(f"Error querying database: {exc}")
        sys.exit(1)

    if not doc_res.data:
        print(f"Error: Document with ID '{document_id}' was not found.")
        sys.exit(1)

    doc = doc_res.data[0]
    user_id = doc["user_id"]
    doc_name = doc["name"]
    doc_status = doc["status"]

    print(f"      Document: '{doc_name}' (Status: {doc_status}, Pages: {doc['page_count']})")

    if doc_status != "ready":
        print(
            f"      [Warning] Document status is '{doc_status}'. "
            f"The match_chunks function only searches documents with status='ready'."
        )

    print(f"\n[2/3] Generating 768-dim embedding for question:")
    print(f"      \"{question}\"")

    try:
        query_vector = embed_query(question)
    except Exception as exc:
        print(f"Error generating query embedding: {exc}")
        sys.exit(1)

    print(f"      Generated embedding vector with {len(query_vector)} dimensions.")

    print(f"\n[3/3] Querying match_chunks RPC for top 3 matches...")
    rpc_params = {
        "query_embedding": query_vector,
        "match_count": 3,
        "p_user_id": user_id,
        "p_document_ids": [document_id],
    }

    try:
        search_res = supabase.rpc("match_chunks", rpc_params).execute()
        matches = search_res.data or []
    except Exception as exc:
        print(f"Error calling match_chunks function: {exc}")
        sys.exit(1)

    if not matches:
        print("      No matching chunks found for this query and document.")
        return

    print(f"\nTop {len(matches)} Matching Chunks:")
    print("=" * 70)

    for idx, match in enumerate(matches, start=1):
        similarity = match.get("similarity", 0.0)
        page_num = match.get("page_number", "N/A")
        content = match.get("content", "").strip()
        preview = content if len(content) <= 300 else content[:300] + "..."

        print(f"Rank #{idx} | Page: {page_num} | Similarity Score: {similarity:.4f} ({similarity * 100:.1f}%)")
        print("-" * 70)
        print(preview)
        print("=" * 70)


if __name__ == "__main__":
    main()
